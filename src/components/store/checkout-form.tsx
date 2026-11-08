"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useCart, type PaymentMethod } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/data/products";
import PaymentResultModal from "@/components/store/payment-result-modal";
import LoadingTile from "@/components/ui/loading-tile";

type AddressArea = {
  code: string;
  name: string;
  barangays?: AddressArea[];
  cities?: AddressArea[];
  municipalities?: AddressArea[];
  provinces?: AddressArea[];
};

async function geocodeDeliveryAddress(query: string) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("Delivery location could not be verified. Map service is not configured.");
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=ph&limit=1&access_token=${token}`,
  );
  if (!response.ok) {
    throw new Error("Delivery location could not be verified. Please try again.");
  }

  const body = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };
  const center = body.features?.[0]?.center;
  if (
    !center ||
    center.length !== 2 ||
    !Number.isFinite(center[0]) ||
    !Number.isFinite(center[1])
  ) {
    throw new Error("Delivery location could not be found. Check the address details.");
  }

  return { longitude: center[0], latitude: center[1] };
}

export default function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, shipping, total, placeOrder, storageMessage, hasUnavailableItems } =
    useCart();
  const { user, account, loading } = useAuth();
  const [formError, setFormError] = useState("");
  const [addressData, setAddressData] = useState<AddressArea[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");
  const [deviceLocation, setDeviceLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const requestedPaymentMethod = searchParams.get("paymentMethod");
  const isBuyNowCheckout =
    requestedPaymentMethod === "cod" || requestedPaymentMethod === "gcash";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    requestedPaymentMethod === "gcash" ? "gcash" : "cod",
  );
  const accountName = [account?.firstname, account?.middlename, account?.lastname]
    .filter(Boolean)
    .join(" ");
  const profileAddress =
    account?.address ||
    (typeof user?.user_metadata?.address === "string"
      ? user.user_metadata.address
      : "");
  const profilePostalCode =
    account?.postal_code ||
    (typeof user?.user_metadata?.postalCode === "string"
      ? user.user_metadata.postalCode
      : "");
  const profileLandmark = account?.landmark ?? "";
  const savedRegion = addressData.find((area) =>
    area.code === account?.region_code ||
    area.name.toLowerCase() === account?.region?.toLowerCase(),
  );
  const effectiveRegionCode = regionCode || savedRegion?.code || account?.region_code || "";
  const selectedRegion = addressData.find((area) => area.code === effectiveRegionCode);
  const provinces = selectedRegion?.provinces ?? [];
  const savedProvince = provinces.find((area) =>
    area.code === account?.province_code ||
    area.name.toLowerCase() === account?.province?.toLowerCase(),
  );
  const savedAddressRegionSelected = effectiveRegionCode === savedRegion?.code;
  const effectiveProvinceCode = provinceCode ||
    (savedAddressRegionSelected ? savedProvince?.code || account?.province_code : "") || "";
  const cities = selectedRegion
    ? effectiveProvinceCode
      ? [
          ...(provinces.find((area) => area.code === effectiveProvinceCode)?.cities ?? []),
          ...(provinces.find((area) => area.code === effectiveProvinceCode)?.municipalities ?? []),
        ]
      : [...(selectedRegion.cities ?? []), ...(selectedRegion.municipalities ?? [])]
    : [];
  const savedCity = cities.find((area) =>
    area.code === account?.city_code ||
    area.name.toLowerCase() === account?.city?.toLowerCase(),
  );
  const savedAddressProvinceSelected =
    provinces.length === 0 || effectiveProvinceCode === savedProvince?.code;
  const effectiveCityCode = cityCode ||
    (savedAddressRegionSelected && savedAddressProvinceSelected
      ? savedCity?.code || account?.city_code
      : "") || "";
  const selectedCity = cities.find((area) => area.code === effectiveCityCode);
  const barangays = selectedCity?.barangays ?? [];
  const savedBarangay = barangays.find((area) =>
    area.code === account?.barangay_code ||
    area.name.toLowerCase() === account?.barangay?.toLowerCase(),
  );
  const savedAddressCitySelected = effectiveCityCode === savedCity?.code;
  const effectiveBarangayCode = barangayCode ||
    (savedAddressRegionSelected && savedAddressProvinceSelected && savedAddressCitySelected
      ? savedBarangay?.code || account?.barangay_code
      : "") || "";

  useEffect(() => {
    let active = true;
    fetch("/data/philippine-addresses.json")
      .then(async (response) => {
        if (!response.ok) throw new Error("Address options could not be loaded.");
        return (await response.json()) as AddressArea[];
      })
      .then((areas) => {
        if (active) setAddressData(areas);
      })
      .catch(() => {
        if (active) setFormError("Address options could not be loaded. Please refresh and try again.");
      })
      .finally(() => {
        if (active) setAddressLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Your browser does not support device location.");
      return;
    }
    setLocationStatus("Requesting your device location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
          setLocationStatus("Your device returned an invalid location.");
          return;
        }
        setDeviceLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setLocationStatus(`Location ready (accuracy ±${Math.round(coords.accuracy)} m).`);
      },
      (error) => {
        setLocationStatus(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access or continue with address verification."
            : "Your current location could not be retrieved. Continue with address verification.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);
    const submittedRegionCode = String(formData.get("region") ?? "").trim();
    const submittedProvinceCode = String(formData.get("province") ?? "").trim();
    const submittedCityCode = String(formData.get("city") ?? "").trim();
    const submittedBarangayCode = String(formData.get("barangay") ?? "").trim();
    const resolvedRegionCode = submittedRegionCode || effectiveRegionCode;
    const resolvedRegion = addressData.find((area) => area.code === resolvedRegionCode) ?? selectedRegion;
    const resolvedProvinces = resolvedRegion?.provinces ?? [];
    const resolvedProvinceCode = submittedProvinceCode || effectiveProvinceCode;
    const resolvedProvince = resolvedProvinces.find((area) => area.code === resolvedProvinceCode);
    const resolvedCities = resolvedRegion
      ? resolvedProvinceCode
        ? [
            ...(resolvedProvinces.find((area) => area.code === resolvedProvinceCode)?.cities ?? []),
            ...(resolvedProvinces.find((area) => area.code === resolvedProvinceCode)?.municipalities ?? []),
          ]
        : [...(resolvedRegion.cities ?? []), ...(resolvedRegion.municipalities ?? [])]
      : [];
    const resolvedCityCode = submittedCityCode || effectiveCityCode;
    const resolvedCity = resolvedCities.find((area) => area.code === resolvedCityCode) ?? selectedCity;
    const resolvedBarangays = resolvedCity?.barangays ?? [];
    const resolvedBarangayCode = submittedBarangayCode || effectiveBarangayCode;
    const resolvedBarangay = resolvedBarangays.find((area) => area.code === resolvedBarangayCode);
    const region = resolvedRegion?.name ?? account?.region ?? "";
    const province = resolvedProvince?.name ?? account?.province ?? "";
    const city = resolvedCity?.name ?? account?.city ?? "";
    const barangay = resolvedBarangay?.name ?? account?.barangay ?? "";
    if (!region || !resolvedRegionCode || !city || !resolvedCityCode || !barangay || !resolvedBarangayCode) {
      setFormError("Select your region, city or municipality, and barangay.");
      return;
    }

    const customer = {
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      address: String(formData.get("address")).trim(),
      city,
      postalCode: String(formData.get("postalCode")).trim(),
      landmark: String(formData.get("landmark")).trim(),
      region,
      regionCode: resolvedRegionCode,
      province,
      provinceCode: resolvedProvinceCode,
      cityCode: resolvedCityCode,
      barangay,
      barangayCode: resolvedBarangayCode,
    };
    try {
      const location = deviceLocation
        ? {
            latitude: deviceLocation.latitude,
            longitude: deviceLocation.longitude,
            locationSource: "device" as const,
            locationAccuracyMeters: deviceLocation.accuracy,
          }
        : {
            ...(await geocodeDeliveryAddress(
              [customer.address, customer.barangay, customer.city, customer.province || customer.region, "Philippines"]
                .filter(Boolean)
                .join(", "),
            )),
            locationSource: "address" as const,
            locationAccuracyMeters: null,
          };
      const result = await placeOrder({ ...customer, ...location }, paymentMethod);
      if (!result) throw new Error("Your order could not be created.");
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      router.push(`/orders#${result.order.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Your order could not be created.");
    }
  }

  if (loading) {
    return <div className="checkout-loading"><LoadingTile label="Loading checkout" detail="Preparing your saved contact and delivery details." /></div>;
  }

  if (!user) {
    return (
      <div className="checkout-empty">
        <h2>Sign in before checkout.</h2>
        <p>Your account is required to save and access order details.</p>
        <Link className="button button-dark" href="/login">Sign in <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your bag is empty.</h2>
        <p>Add a tile or a compatible component before checkout.</p>
        <Link className="button button-dark" href="/shop">Browse components <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  return (
    <>
      <div className="checkout-layout">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <section className="checkout-section">
          <p className="eyebrow">01 / CONTACT</p>
          <h2>Who should we contact?</h2>
          <div className="checkout-fields">
            <label>
              Full name
              <input
                autoComplete="name"
                defaultValue={accountName}
                name="name"
                required
              />
            </label>
            <label>
              Email address
              <input
                autoComplete="email"
                defaultValue={account?.email || user.email}
                name="email"
                required
                type="email"
              />
            </label>
            <label>
              Phone number
              <input
                autoComplete="tel"
                defaultValue={account?.contactNo ?? ""}
                name="phone"
                required
                type="tel"
              />
            </label>
          </div>
        </section>
        <section className="checkout-section">
          <p className="eyebrow">02 / DELIVERY</p>
          <h2>Where should we send it?</h2>
          <div className="checkout-fields">
            <label className="field-wide">
              Street address
              <input
                autoComplete="street-address"
                defaultValue={profileAddress}
                name="address"
                required
              />
            </label>
            <label>
              Region
              <select
                autoComplete="address-level1"
                name="region"
                onChange={(event) => {
                  setRegionCode(event.target.value);
                  setProvinceCode("");
                  setCityCode("");
                  setBarangayCode("");
                }}
                required
                value={effectiveRegionCode}
              >
                <option value="">Select region</option>
                {addressData.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              Province
              <select
                disabled={!effectiveRegionCode || provinces.length === 0}
                name="province"
                onChange={(event) => {
                  setProvinceCode(event.target.value);
                  setCityCode("");
                  setBarangayCode("");
                }}
                required={provinces.length > 0}
                value={effectiveProvinceCode}
              >
                <option value="">{provinces.length ? "Select province" : "Not applicable"}</option>
                {provinces.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              City / Municipality
              <select
                autoComplete="address-level2"
                disabled={!effectiveRegionCode || (provinces.length > 0 && !effectiveProvinceCode)}
                name="city"
                onChange={(event) => {
                  setCityCode(event.target.value);
                  setBarangayCode("");
                }}
                required
                value={effectiveCityCode}
              >
                <option value="">Select city or municipality</option>
                {cities.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              Barangay
              <select
                disabled={!effectiveCityCode}
                name="barangay"
                onChange={(event) => setBarangayCode(event.target.value)}
                required
                value={effectiveBarangayCode}
              >
                <option value="">Select barangay</option>
                {barangays.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              Postal code
              <input
                autoComplete="postal-code"
                defaultValue={profilePostalCode}
                name="postalCode"
                required
              />
            </label>
            <label className="field-wide">
              Landmark or delivery instructions
              <textarea defaultValue={profileLandmark} name="landmark" rows={3} />
            </label>
            <div className="field-wide">
              <button className="button button-outline" onClick={useCurrentLocation} type="button">
                Use my current location
              </button>
              <p className="mt-2 text-xs text-[#777]" role="status">
                {locationStatus || "Use GPS for a more accurate delivery pin. Your browser will ask for permission."}
              </p>
            </div>
          </div>
        </section>
        {!isBuyNowCheckout && (
          <section className="checkout-section demo-payment">
            <p className="eyebrow">03 / PAYMENT</p>
            <h2>Choose how to pay.</h2>
            <div className="payment-methods">
              <label className={`payment-method${paymentMethod === "cod" ? " is-selected" : ""}`}>
                <input
                  checked={paymentMethod === "cod"}
                  name="paymentMethod"
                  onChange={() => setPaymentMethod("cod")}
                  type="radio"
                  value="cod"
                />
                <span>
                  <strong>Cash on delivery</strong>
                  <small>Pay when your order arrives.</small>
                </span>
              </label>
              <label className={`payment-method${paymentMethod === "gcash" ? " is-selected" : ""}`}>
                <input
                  checked={paymentMethod === "gcash"}
                  name="paymentMethod"
                  onChange={() => setPaymentMethod("gcash")}
                  type="radio"
                  value="gcash"
                />
                <span>
                  <strong>GCash</strong>
                  <small>Pay securely through PayMongo.</small>
                </span>
              </label>
            </div>
          </section>
        )}
        {storageMessage && <p className="storage-message" role="status">{storageMessage}</p>}
        {hasUnavailableItems && (
          <p className="auth-status" role="alert">
            One or more items are out of stock. Remove unavailable items from your bag before placing an order.
          </p>
        )}
        {formError && <p className="auth-status" role="alert">{formError}</p>}
        <button className="button button-dark place-order-button" disabled={hasUnavailableItems || addressLoading} type="submit">
        {paymentMethod === "gcash" ? "Continue to GCash" : "Place order"} <span aria-hidden="true">→</span>
        </button>
      </form>

      <aside className="order-summary checkout-summary">
        <p className="eyebrow">YOUR ORDER</p>
        <div className="checkout-line-items">
          {items.map(({ product, quantity }) => (
            <div className="checkout-line-item" key={product.id}>
              <span>{product.name} <span>× {quantity}</span></span>
              <strong>{formatPrice(product.price * quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="summary-line"><span>Delivery</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
        <div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
        <p className="summary-note">Free delivery on orders of ₱5,000 or more.</p>
      </aside>
      </div>
      {paymentCancelled && (
        <PaymentResultModal
          closePath="/checkout"
          kind="error"
          message="Your GCash payment was cancelled or declined. No payment was recorded. You can try again or choose cash on delivery."
          title="Payment was not completed."
        />
      )}
      {formError && (
        <PaymentResultModal
          closePath="/checkout"
          kind="error"
          message={formError}
          title={paymentMethod === "cod" ? "We could not place the order." : "We could not start the payment."}
        />
      )}
    </>
  );
}
