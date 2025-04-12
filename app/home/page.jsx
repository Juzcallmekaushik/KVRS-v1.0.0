// pages/home/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabaseClient";
import { signOut } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const supabase = createClient();

  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    const fetchUserDetails = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .single();

      if (error) {
        console.error("Error fetching user details:", error.message);
      } else {
        setUserDetails(data);
      }

      setLoading(false);
    };

    fetchUserDetails();
  }, [session, status, supabase]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <img src="/favicon.ico" alt="Loading..." className="w-24 h-24 animate-pulse" />
      </div>
    );
  }

  if (!userDetails && !loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white">
        No user data found.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center px-6 py-12">
      <div className="w-full max-w-md border-white border-1 bg-[#000715] text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-l font-semibold text-center mb-2">LUCKY DRAW NUMBER:</h2>
        <div className="mb-5">
          <h3 className="font-black text-5xl text-center mb-0">{userDetails.lucky_number}</h3>
        </div>
        <div className="border-t border-white my-5 "></div>
        <h2 className="text-l font-bold text-left mb-2 ">Your Details:</h2>
        <div className="mb-3 ">
          <p className="text-sm font-medium text-left">Name</p>
          <p className="text-lg">{userDetails.name}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-medium text-left">Email</p>
          <p className="text-lg">{userDetails.email}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-medium text-left">Phone</p>
          <p className="text-lg">{userDetails.phone}</p>
        </div>
        <div className="mt-10">
          <button
            onClick={() => signOut({ callbackUrl: "/register" })}
            className="text-sm text-red-500 font-medium hover:underline focus:outline-none cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
