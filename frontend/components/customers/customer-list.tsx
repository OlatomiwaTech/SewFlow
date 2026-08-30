"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getCustomers } from "@/lib/customers";
import type {
  Customer,
} from "@/types/customer";

interface CustomerListProps {
  token: string;
}

export function CustomerList({
  token,
}: Readonly<CustomerListProps>) {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [search, setSearch] =
    useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadCustomers = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await getCustomers(token, {
            search,
            page,
            limit: 20,
          });

        setCustomers(response.data);
        setTotalPages(
          response.pagination.totalPages,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load customers.",
        );
      } finally {
        setLoading(false);
      }
    },
    [page, search, token],
  );

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function handleSearch(
    value: string,
  ) {
    setSearch(value);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="rounded-xl border p-8 text-center">
        Loading customers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="mb-4 text-sm">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void loadCustomers()
          }
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(event) =>
            handleSearch(event.target.value)
          }
          placeholder="Search customers..."
          className="w-full max-w-md rounded-lg border px-4 py-2.5"
        />

        <Link
          href="/customers/new"
          className="rounded-lg px-4 py-2.5 text-center text-sm font-medium"
        >
          + New customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-xl border p-12 text-center">
          <h2 className="text-lg font-semibold">
            No customers found
          </h2>

          <p className="mt-2 text-sm">
            {search
              ? "Try a different search."
              : "Add your first customer to start building their tailoring history."}
          </p>

          {!search && (
            <Link
              href="/customers/new"
              className="mt-6 inline-block rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              Add customer
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <div className="hidden grid-cols-[2fr_1.5fr_2fr] gap-4 border-b px-6 py-3 text-sm font-medium md:grid">
              <span>Name</span>
              <span>Phone</span>
              <span>Email</span>
            </div>

            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="grid gap-2 border-b px-6 py-4 last:border-0 hover:bg-black/[0.02] md:grid-cols-[2fr_1.5fr_2fr] md:gap-4"
              >
                <div>
                  <p className="font-medium">
                    {customer.firstName}{" "}
                    {customer.lastName ?? ""}
                  </p>

                  <p className="text-sm md:hidden">
                    {customer.phone}
                  </p>
                </div>

                <span className="hidden text-sm md:block">
                  {customer.phone}
                </span>

                <span className="text-sm">
                  {customer.email ?? "—"}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1,
                  ),
                )
              }
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}