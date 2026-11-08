"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth, type UserAccount } from "@/components/auth-provider";
import LoadingTile from "@/components/ui/loading-tile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function calculateAge(birthDate: string | null | undefined) {
  if (!birthDate) return null;
  const birthday = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birthday.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() < birthday.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}
type AddressArea = { code: string; name: string; barangays?: AddressArea[]; cities?: AddressArea[]; municipalities?: AddressArea[]; provinces?: AddressArea[] };

export default function AccountPage() {
  const { user, account, loading, updateAccount } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [addressData, setAddressData] = useState<AddressArea[]>([]);
  const [regionCode, setRegionCode] = useState(account?.region_code ?? "");
  const [provinceCode, setProvinceCode] = useState(account?.province_code ?? "");
  const [cityCode, setCityCode] = useState(account?.city_code ?? "");
  const [barangayCode, setBarangayCode] = useState(account?.barangay_code ?? "");
  const [avatarUrl, setAvatarUrl] = useState(account?.avatar_url ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  useEffect(() => {
    fetch("/data/philippine-addresses.json").then((response) => response.json()).then(setAddressData).catch(() => setError("Address options could not be loaded."));
  }, []);

  const age = useMemo(() => calculateAge(account?.birth_date), [account?.birth_date]);
  const selectedRegion = addressData.find((area) => area.code === regionCode);
  const provinces = selectedRegion?.provinces ?? [];
  const cities = selectedRegion ? provinceCode
    ? [...(provinces.find((area) => area.code === provinceCode)?.cities ?? []), ...(provinces.find((area) => area.code === provinceCode)?.municipalities ?? [])]
    : [...(selectedRegion.cities ?? []), ...(selectedRegion.municipalities ?? [])] : [];
  const selectedCity = cities.find((area) => area.code === cityCode);
  const barangays = selectedCity?.barangays ?? [];

  async function handleAvatarChange(file: File | undefined) {
    if (!file || !user) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setAvatarUploading(true);
    setError("");
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${extension}`;
      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw new Error(`Profile photo could not be uploaded: ${uploadError.message}`);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(`${data.publicUrl}?v=${Date.now()}`);
      setMessage("Profile photo uploaded. Save your profile to keep it.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Profile photo could not be uploaded.");
    } finally {
      setAvatarUploading(false);
    }
  }

  if (loading) {
    return <main className="page-shell account-page"><LoadingTile label="Loading profile" detail="Fetching your saved account and delivery details." /></main>;
  }

  if (!user || !account) {
    return (
      <main className="page-shell account-page">
        <p className="eyebrow">ACCOUNT</p>
        <h1>Sign in to manage your profile.</h1>
        <Link className="button button-dark" href="/login?redirectTo=%2Faccount">
          Sign in <span aria-hidden="true">→</span>
        </Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateAccount({
        firstname: String(formData.get("firstname")).trim(),
        middlename: String(formData.get("middlename")).trim() || null,
        lastname: String(formData.get("lastname")).trim(),
        contactNo: String(formData.get("contactNo")).trim() || null,
        address: String(formData.get("address")).trim() || null,
        city: cities.find((area) => area.code === cityCode)?.name ?? "",
        region: addressData.find((area) => area.code === regionCode)?.name ?? "",
        region_code: regionCode,
        province: provinces.find((area) => area.code === provinceCode)?.name ?? null,
        province_code: provinceCode || null,
        city_code: cityCode,
        barangay: barangays.find((area) => area.code === barangayCode)?.name ?? "",
        barangay_code: barangayCode,
        postal_code: String(formData.get("postalCode")).trim() || null,
        landmark: String(formData.get("landmark")).trim() || null,
        gender: (String(formData.get("gender")) || null) as UserAccount["gender"],
        birth_date: String(formData.get("birthDate")) || null,
        avatar_url: avatarUrl || account?.avatar_url || null,
      });
      setMessage("Your profile and delivery details were saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profile could not be saved.");
    } finally {
      setSaving(false);
    }

  }

  return (
    <main className="page-shell account-page">
      <div className="account-profile-hero">
        <div className="account-avatar account-profile-avatar" aria-hidden="true">
          {avatarUrl || account.avatar_url ? <img alt="" src={avatarUrl || account.avatar_url || undefined} /> : (account.firstname || user.email || "A").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="eyebrow">PROFILE &amp; SETTINGS</p>
          <h1>Edit your account.</h1>
          <p className="account-page-intro">
            Keep your delivery and contact details ready for a faster checkout.
          </p>
        </div>
      </div>

      <nav className="account-page-nav" aria-label="Account navigation">
        <Link className="is-active" href="/account">Profile</Link>
        <Link href="/account/orders">Purchase history</Link>
        <Link href="/cart">Your bag</Link>
        <Link href="/contact">Support</Link>
      </nav>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label>
          Profile photo
          <input accept="image/*" disabled={avatarUploading} onChange={(event) => void handleAvatarChange(event.target.files?.[0])} type="file" />
        </label>
        <section className="profile-form-section">
          <p className="eyebrow">PERSONAL DETAILS</p>
          <div className="profile-fields">
            <label>
              First name
              <input defaultValue={account.firstname ?? ""} name="firstname" required />
            </label>
            <label>
              Middle name
              <input defaultValue={account.middlename ?? ""} name="middlename" />
            </label>
            <label>
              Last name
              <input defaultValue={account.lastname ?? ""} name="lastname" required />
            </label>
            <label>
              Email
              <input defaultValue={user.email} disabled type="email" />
            </label>
            <label>
              Contact number
              <input defaultValue={account.contactNo ?? ""} name="contactNo" required type="tel" />
            </label>
            <label>
              Gender
              <select defaultValue={account.gender ?? ""} name="gender">
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label>
              Birthday
              <input defaultValue={account.birth_date ?? ""} name="birthDate" type="date" />
            </label>
            <label>
              Age
              <input value={age === null ? "—" : age} readOnly aria-label="Calculated age" />
            </label>
          </div>
        </section>

        <section className="profile-form-section">
          <p className="eyebrow">DELIVERY DETAILS</p>
          <div className="profile-fields">
            <label className="profile-field-wide">
              Street address
              <input defaultValue={account.address ?? ""} name="address" required />
            </label>
            <label>
              Region
              <select name="region" value={regionCode} onChange={(event) => { setRegionCode(event.target.value); setProvinceCode(""); setCityCode(""); setBarangayCode(""); }} required>
                <option value="">Select region</option>{addressData.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              Province
              <select name="province" value={provinceCode} disabled={!regionCode || provinces.length === 0} onChange={(event) => { setProvinceCode(event.target.value); setCityCode(""); setBarangayCode(""); }} required={provinces.length > 0}>
                <option value="">{provinces.length ? "Select province" : "Not applicable"}</option>{provinces.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              City / Municipality
              <select name="city" value={cityCode} disabled={!regionCode || (provinces.length > 0 && !provinceCode)} onChange={(event) => { setCityCode(event.target.value); setBarangayCode(""); }} required>
                <option value="">Select city or municipality</option>{cities.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              Barangay
              <select name="barangay" value={barangayCode} disabled={!cityCode} onChange={(event) => setBarangayCode(event.target.value)} required>
                <option value="">Select barangay</option>{barangays.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}
              </select>
            </label>
            <label>
              Postal code
              <input defaultValue={account.postal_code ?? ""} name="postalCode" required />
            </label>
            <label className="profile-field-wide">
              Landmark or delivery instructions
              <textarea defaultValue={account.landmark ?? ""} name="landmark" rows={3} />
            </label>
          </div>
        </section>

        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-dark" disabled={saving} type="submit">
          {saving ? "Saving..." : "Save profile"} <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="account-page-actions">
        <Link className="button button-outline" href="/cart">View your bag <span aria-hidden="true">→</span></Link>
        <Link className="button button-outline" href="/account/orders">Purchase history</Link>
      </div>
    </main>
  );
}
