"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [countryCode, setCountryCode] = useState("+91");
  const [countryIso2, setCountryIso2] = useState("IN");
  const [phoneError, setPhoneError] = useState("");
  const [userChecked, setUserChecked] = useState(false);
  const [isDonor, setIsDonor] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();
  const supabase = createClient();

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
        if (data?.country_calling_code && data?.country) {
          setCountryCode(data.country_calling_code);
          setCountryIso2(data.country);
        }
      } catch (err) {
        console.warn("Failed to fetch country code:", err);
      }
    };

    const checkIfUserExists = async () => {
      const { data } = await supabase
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

    if (session.user.email === process.env.NEXT_PUBLIC_HOST_EMAIL) {
      router.push("/host");
      return;
    }

    fetchCountryCode();
    checkIfUserExists();
  }, [session, status, router]);

  const formatPhoneNumber = (phone, countryIso2) => {
    const parsedPhone = parsePhoneNumberFromString(phone, countryIso2);
    if (!parsedPhone || !parsedPhone.isValid()) return phone;

    const national = parsedPhone.nationalNumber;
    if (countryIso2 === "IN") {
      return `${national.slice(0, 5)} ${national.slice(5)}`;
    } else if (countryIso2 === "MY") {
      return `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
    } else {
      return national.match(/.{1,3}/g)?.join(" ") || national;
    }
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setUserInfo((prev) => ({ ...prev, phone: raw }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, phone } = userInfo;
    const parsedPhone = parsePhoneNumberFromString(phone, countryIso2);

    if (!parsedPhone || !parsedPhone.isValid()) {
      setPhoneError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    setPhoneError("");

    const fullPhone = parsedPhone.formatInternational();
    const luckyNumber = Math.floor(Math.random() * 1000) + 1;

    const { error } = await supabase
      .from("users")
      .upsert([{
        lucky_number: luckyNumber,
        name,
        email,
        phone: fullPhone,
        is_donor: isDonor,
        is_author: isAuthor,
      }]);

    if (error) {
      console.error("Error saving user data to Supabase:", error.message);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/add-to-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        luckyNumber,
        name,
        email,
        phone: fullPhone,
        isAuthor,
        isDonor,
      }),
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

  if (session && userChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-1 bg-black text-white">
        <div className="p-6 w-full max-w-md border border-white rounded-lg shadow-lg bg-[#012719]/70 backdrop-blur">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-left">Name</label>
              <input
                type="text"
                name="name"
                value={userInfo.name}
                onChange={handleChange}
                className="w-full p-2 mt-2 border border-white rounded-md text-white bg-black"
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
                className="w-full p-2 mt-2 border border-white rounded-md text-white bg-black"
                disabled={loading || !!userInfo.email}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-left">Phone</label>
              <div className="flex items-center mt-2 border border-white rounded-md overflow-hidden bg-black">
                <span className="px-3 text-white text-sm whitespace-nowrap select-none bg-black/40">
                  {countryCode}
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formatPhoneNumber(userInfo.phone, countryIso2)}
                  onChange={handlePhoneChange}
                  className="w-full p-2 text-white bg-black placeholder-gray-400 focus:outline-none"
                  disabled={loading}
                  placeholder="0123456789"
                  maxLength={15}
                  required
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-xs mt-2">{phoneError}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Roles</label>
              <div className="flex gap-4 items-center">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isDonor}
                    onChange={(e) => setIsDonor(e.target.checked)}
                    className="mr-2 accent-green-500 cursor-pointer"
                  />
                  Donor
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isAuthor}
                    onChange={(e) => setIsAuthor(e.target.checked)}
                    className="mr-2 accent-green-500 cursor-pointer"
                  />
                  Author
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 mt-4 border border-white text-black bg-white font-semibold rounded-lg hover:bg-green-400 hover:text-black transition-all duration-200 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Registering..." : "Confirm Registration"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/home-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black/80 z-0" />
      <div className="relative z-10 flex flex-col justify-center items-center text-center px-6 py-12 min-h-screen">
        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold tracking-wide">
          KASTURI VIJAYAM'S
        </h2>
        <h1 className="text-2xl sm:text-2xl md:text-4xl lg:text-6xl font-black mb-4 leading-tight">
          INTERNATIONAL INKBOUND
        </h1>
        <button
          onClick={() => signIn("google")}
          className="text-sm sm:text-base border border-white text-white font-semibold px-4 py-2 rounded-lg hover:bg-white transition-all duration-200 cursor-pointer active:bg-white hover:text-black"
        >
          REGISTER
        </button>
      </div>
    </div>
  );
}
