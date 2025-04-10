"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
import { createClient } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneError, setPhoneError] = useState("");
  const [userChecked, setUserChecked] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter(); // Router for navigation
  const supabase = createClient();

  // Check if user already exists + fetch country code
  useEffect(() => {
    if (status === "loading" || !session) return;

    const user = session.user;
    setUserInfo((prev) => ({
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
    }));

    const fetchCountryCode = async () => {
      try {
        const res = await fetch("https://ipapi.co/json");
        const data = await res.json();
        if (data?.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      } catch (err) {
        console.warn("Failed to fetch country code:", err);
      }
    };

    const checkIfUserExists = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (data) {
        window.location.replace("/home");
      } else {
        setUserChecked(true);
      }
    };

    // Redirect if email matches the host email
    if (session.user.email === "codecraftcreate.dev@gmail.com") {
      router.push("/host"); // Redirect to the Host page
      return;
    }

    fetchCountryCode();
    checkIfUserExists();
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, phone } = userInfo;

    // Allow phone number to be up to 10 digits
    if (phone.length === 0 || phone.length > 10) {
      setPhoneError("Phone number must be between 1 and 10 digits.");
      setLoading(false);
      return;
    } else {
      setPhoneError("");
    }

    const fullPhone = `${countryCode} ${phone}`;
    const luckyNumber = Math.floor(Math.random() * 1000) + 1;

    const { data, error } = await supabase
      .from("users")
      .upsert([{ name, email, phone: fullPhone, lucky_number: luckyNumber }]);

    if (error) {
      console.error("Error saving user data to Supabase:", error.message);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/add-to-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone: fullPhone, luckyNumber }),
    });

    if (!res.ok) {
      console.error("Error saving data to Google Sheets:", res.statusText);
      setLoading(false);
      return;
    }

    window.location.replace("/home");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  if (status === "loading" || (session && !userChecked)) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <img src="/favicon.ico" alt="Loading..." className="w-24 h-24 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center text-center px-6 py-12">
      <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold tracking-wide">
        KASTURI VIJAYAM PRESENTS
      </h2>
      <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold mb-4 leading-tight">
        [ EVENT NAME ]
      </h1>

      {!session && (
        <button
          onClick={() => signIn("google")}
          className="text-sm sm:text-base border border-white text-white font-semibold px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-all duration-200 active:bg-white active:text-black"
        >
          REGISTER
        </button>
      )}

      {session && userChecked && (
        <div className="mt-8 p-6 w-full max-w-md border border-white rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-left">Name</label>
              <input
                type="text"
                name="name"
                value={userInfo.name}
                onChange={handleChange}
                className="w-full p-2 mt-2 border border-white rounded-md text-white bg-transparent"
                disabled={loading || !!userInfo.name}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-left">Email</label>
              <input
                type="email"
                name="email"
                value={userInfo.email}
                onChange={handleChange}
                className="w-full p-2 mt-2 border border-white rounded-md text-white bg-transparent"
                disabled={loading || !!userInfo.email}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-left">Phone</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 p-2 mt-2 border border-white rounded-md text-white bg-transparent"
                />
                <input
                  type="text"
                  name="phone"
                  value={userInfo.phone}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-white rounded-md text-white bg-transparent"
                  disabled={loading}
                  placeholder="0123456789"
                  required
                  maxLength={10}
                />
              </div>
              {phoneError && <p className="text-red-500 text-xs mt-2">{phoneError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2 mt-4 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-all duration-200 active:bg-white active:text-black"
              disabled={loading}
            >
              {loading ? "Registering..." : "Confirm Registration"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
