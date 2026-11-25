"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review, ReviewStatus } from "@/domain/review/types";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { inputClasses } from "@/components/ui/Field";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Чака преглед",
  approved: "Одобрен",
  rejected: "Отказан",
  hidden: "Скрит",
};

type StatusFilter = "all" | ReviewStatus;

export function ReviewsTable({ initialReviews }: { initialReviews: Review[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reviews =
    statusFilter === "all" ? initialReviews : initialReviews.filter((review) => review.status === statusFilter);

  async function updateStatus(id: string, status: ReviewStatus) {
    setPendingId(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPendingId(null);
    router.refresh();
  }

  async function deleteReview(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <label className="flex max-w-xs flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-800">Статус</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className={inputClasses}
        >
          <option value="all">Всички</option>
          <option value="pending">Чакат преглед</option>
          <option value="approved">Одобрени</option>
          <option value="rejected">Отказани</option>
          <option value="hidden">Скрити</option>
        </select>
      </label>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-lavender-200 bg-paper-50">
        <table className="w-full text-left text-sm">
          <thead className="bg-lavender-50 text-ink-800">
            <tr>
              <th className="px-4 py-3">Автор</th>
              <th className="px-4 py-3">Оценка</th>
              <th className="px-4 py-3">Отзив</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Потвърден</th>
              <th className="px-4 py-3">Подаден</th>
              <th className="px-4 py-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-t border-lavender-200 align-top">
                <td className="px-4 py-3 font-medium text-ink-900">
                  {review.isAnonymous ? `${review.displayName} (анонимен)` : review.displayName}
                </td>
                <td className="px-4 py-3">
                  {review.rating !== null ? <StarRating value={review.rating} starClassName="h-4 w-4" /> : "—"}
                </td>
                <td className="max-w-sm px-4 py-3 text-ink-700">{review.body}</td>
                <td className="px-4 py-3 text-ink-700">{STATUS_LABELS[review.status]}</td>
                <td className="px-4 py-3 text-ink-700">{review.confirmedAt ? "Да" : "Не"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-700">
                  {new Date(review.createdAt).toLocaleDateString("bg-BG")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pendingId === review.id || review.status === "approved"}
                      onClick={() => updateStatus(review.id, "approved")}
                    >
                      Одобри
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pendingId === review.id || review.status === "rejected"}
                      onClick={() => updateStatus(review.id, "rejected")}
                    >
                      Откажи
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pendingId === review.id || review.status === "hidden"}
                      onClick={() => updateStatus(review.id, "hidden")}
                    >
                      Скрий
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={pendingId === review.id}
                      onClick={() => deleteReview(review.id)}
                    >
                      Изтрий
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-700">
                  Няма отзиви в тази категория.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
