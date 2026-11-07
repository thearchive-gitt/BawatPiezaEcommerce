"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void apiFetch(`/api/v1/store/products/${encodeURIComponent(productId)}/reviews`)
      .then(async (response) => {
        const body = (await response.json()) as { reviews?: Review[]; average?: number };
        if (!active) return;
        setReviews(body.reviews ?? []);
        setAverage(body.average ?? 0);
      })
      .catch(() => {
        if (active) setMessage("Reviews could not be loaded right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  const ratingStars = useMemo(() => "★".repeat(Math.round(average)) + "☆".repeat(5 - Math.round(average)), [average]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await apiFetch(`/api/v1/store/products/${encodeURIComponent(productId)}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      const body = (await response.json()) as { review: Review };
      setReviews((current) => [{ ...body.review, author: "You" }, ...current]);
      setAverage((current) => Number(((current * reviews.length + rating) / (reviews.length + 1)).toFixed(1)));
      setComment("");
      setMessage("Your review is now visible to other customers.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your review could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="product-reviews" aria-labelledby="product-reviews-heading">
      <div className="product-reviews-heading">
        <div>
          <p className="eyebrow">CUSTOMER VOICE</p>
          <h2 id="product-reviews-heading">Reviews and ratings</h2>
        </div>
        <div className="product-rating-summary">
          <strong>{average ? average.toFixed(1) : "—"}</strong>
          <span aria-label={`${average} out of 5 stars`}>{ratingStars}</span>
          <small>{reviews.length} review{reviews.length === 1 ? "" : "s"}</small>
        </div>
      </div>
      {user && (
        <form className="review-form" onSubmit={submitReview}>
          <h3>Share your experience</h3>
          <p>Only customers with a delivered order can publish a review.</p>
          <div className="review-rating-picker" aria-label="Choose a rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button aria-label={`${value} star${value === 1 ? "" : "s"}`} className={value <= rating ? "is-selected" : ""} key={value} onClick={() => setRating(value)} type="button">★</button>
            ))}
          </div>
          <textarea maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="What did you think about this product?" required rows={4} value={comment} />
          <div className="review-form-footer">
            <span>{comment.length}/2000</span>
            <button className="button button-dark" disabled={submitting} type="submit">{submitting ? "Publishing..." : "Publish review"} <span aria-hidden="true">→</span></button>
          </div>
          {message && <p className="review-message" role="status">{message}</p>}
        </form>
      )}
      {!user && <p className="review-signin">Sign in after your delivery to share a review.</p>}
      <div className="review-list">
        {loading ? <p className="review-empty">Loading reviews...</p> : reviews.length === 0 ? <p className="review-empty">Be the first customer to review this product.</p> : reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div className="review-card-top"><strong>{review.author}</strong><span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>
            <p>{review.comment}</p>
            <small>{new Date(review.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
