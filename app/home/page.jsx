// pages/home/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabaseClient";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation"; // Import useRouter

export default function HomePage() {
  const { data: session, status } = useSession();
  const supabase = createClient();
  const router = useRouter(); // Initialize useRouter

  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/register"); // Redirect if no session
      return;
    }

    const fetchUserDetails = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user details:", error.message);
        router.push("/register"); // Redirect if error fetching user details
      } else {
        setUserDetails(data);
      }

      setLoading(false);
    };

    fetchUserDetails();
  }, [session, status, supabase, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <img src="/favicon.ico" alt="Loading..." className="w-24 h-24 animate-pulse" />
      </div>
    );
  }

  if (!userDetails && !loading) {
    router.push("/register"); // Ensure redirection if no userDetails
    return null; // Prevent rendering anything while redirecting
  }

  return (
    <div className="min-h-screen flex justify-center items-center px-6 py-12">
      <div className="w-full max-w-md border-white border-1 bg-[#000715] text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-l font-semibold text-center mb-2">LUCKY DRAW NUMBER:</h2>
        <div className="mb-5">
          <h3 className="font-black text-5xl text-center mb-0">{userDetails.lucky_number}</h3>
        </div>
        <div className="border-t border-white my-5 "></div>
        <div className="mb-3">
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
        {(userDetails.is_donor || userDetails.is_author) && (
          <div className="mb-3">
            <p className="text-sm font-medium text-left">Roles</p>
            <p className="text-lg text-green-300">
              <strong>
                {userDetails.is_donor && userDetails.is_author
                  ? "Donor & Author"
                  : userDetails.is_donor
                  ? "Donor"
                  : "Author"}
              </strong>
            </p>
          </div>
        )}
        <div className="mt-5">
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
