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
    userDetails && (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-[350px] max-w-sm md:max-w-md bg-[#0D1117] text-white rounded-2xl p-6 shadow-lg border border-white/10">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-400">Your Lucky Draw Number</p>
            <h1 className="text-6xl font-black text-yellow-400 tracking-widest">
              {userDetails.lucky_number}
            </h1>
          </div>
          <div className="border-b border-gray-800 mb-3"></div>
          <div className="flex justify-center mb-3">
            <button
              onClick={() =>
                window.open(
                  "https://www.google.com/maps/place/NTR+Auditorium,+PSR+Telugu+University/@17.3954444,78.4673948,784m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bcb9763846d8e35:0x7436340b9b7889ac!8m2!3d17.3954393!4d78.4699697!16s%2Fg%2F11c713c9x6?entry=ttu&g_ep=EgoyMDI1MDQyMy4wIKXMDSoASAFQAw%3D%3D",
                  "_blank"
                )
              }
              className="inline-flex items-center gap-2 mb-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-1 rounded-md shadow transition cursor-pointer"
            >
              Venue Location
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {userDetails.name && (
              <Info
                label="Name"
                value={userDetails.name}
                valueClass="break-words"
              />
            )}
            {userDetails.email && (
              <Info
                label="Email"
                value={userDetails.email}
                valueClass="break-words"
              />
            )}
            {userDetails.phone && (
              <Info
                label="Phone"
                value={userDetails.phone}
                valueClass="break-words"
              />
            )}
            {userDetails.slot && (
              <Info
                label="Slot Booked"
                value={userDetails.slot}
                valueClass="break-words"
              />
            )}
            {(userDetails.is_donor ||
              userDetails.is_author ||
              userDetails.is_volunteer) && (
              <Info
                label="Roles"
                value={[userDetails.is_donor && "Donor", userDetails.is_author && "Author", userDetails.is_volunteer && "Volunteer"]
                  .filter(Boolean)
                  .join(" & ")}
                valueClass="text-green-400 font-semibold break-words"
              />
            )}
            {userDetails.remarks && (
              <Info
                label="Remarks"
                value={userDetails.remarks}
                valueClass="break-words"
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
    )
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
