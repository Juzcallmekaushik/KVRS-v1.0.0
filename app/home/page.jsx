"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const supabase = createClient();
  const router = useRouter();

  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/register");
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
        router.push("/register");
      } else {
        setUserDetails(data);
      }

      setLoading(false);
    };

    fetchUserDetails();
  }, [session, status, supabase, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <img src="/favicon.ico" alt="Loading..." className="w-20 h-20 animate-pulse" />
      </div>
    );
  }

  if (!userDetails && !loading) {
    router.push("/register");
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-[350px] max-w-sm md:max-w-md bg-[#0D1117] text-white rounded-2xl p-6 shadow-lg border border-white/10">
        <div className="text-center mb-3">
          <p className="text-sm text-gray-400">Your Lucky Draw Number</p>
          <h1 className="text-6xl font-black text-yellow-400 tracking-widest">
            {userDetails.lucky_number}
          </h1>
        </div>
        <div className="border-b border-gray-800 mb-3"></div>
        <div className="space-y-3 text-xs">
          <Info label="Name" value={userDetails.name} />
          <Info label="Email" value={userDetails.email} />
          <Info label="Phone" value={userDetails.phone} />
          {(userDetails.is_donor || userDetails.is_author) && (
            <Info
              label="Roles"
              value={
                userDetails.is_donor && userDetails.is_author
                  ? "Donor & Author"
                  : userDetails.is_donor
                  ? "Donor"
                  : "Author"
              }
              valueClass="text-green-400 font-semibold"
            />
          )}
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => signOut({ callbackUrl: "/register" })}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-26 py-2 rounded-md shadow transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, valueClass = "text-white" }) {
  return (
    <div>
      <p className="text-gray-400 text-m">{label}</p>
      <p className={`text-base font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}
