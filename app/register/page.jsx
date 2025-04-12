"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [countryCode, setCountryCode] = useState("+91");
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
        if (data?.country_calling_code) {
          setCountryCode(data.country_calling_code);
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

    if (session.user.email === "host.kvrs@gmail.com") {
      router.push("/host");
      return;
    }

    fetchCountryCode();
    checkIfUserExists();
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, phone } = userInfo;

    if (phone.length === 0 || phone.length > 10) {
      setPhoneError("Phone number must be between 1 and 10 digits.");
      setLoading(false);
      return;
    } else {
      setPhoneError("");
    }

    const fullPhone = `${countryCode} ${phone}`;
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
      <div 
      className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden"
      //style={{ backgroundImage: 'url("/reg-bg.png")' }}
      >
        <div className="p-4 w-7xl max-w-lg lg:max-w-md lg:w-[500px] lg:h-[535px] border border-white rounded-lg shadow-lg bg-[#012719]/70 backdrop-blur">
          <h2 className="text-xl font-bold text-left mb-0">CONFIRM REGISTRATION</h2>
          <p className="text-[13px] text-left">
            Confirm your registration and join us on <strong>31st May 2025.</strong>
          </p>
          <div className="border-t border-white my-4"></div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-left">Name</label>
                <input
                  type="text"
                  name="name"
                  value={userInfo.name}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-white rounded-md text-white bg-black"
                  disabled={loading || !!userInfo.firs}
                />
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 p-2 mt-2 border border-white rounded-md text-white bg-black cursor-pointer"
                />
                <input
                  type="text"
                  name="phone"
                  value={userInfo.phone}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-white rounded-md text-white bg-black cursor-pointer"
                  disabled={loading}
                  placeholder="0123456789"
                  required
                  maxLength={10}
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-xs mt-2">{phoneError}</p>
              )}
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-2">Roles</label>
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
            <div className="border-t border-white my-5"></div>
              <div className="mb-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.4 accent-green-500 cursor-pointer w-4 h-4"
                  />
                  <span className="text-sm font-thin leading-tight">
                    Please tick the box to confirm that you have read and agree to
                    the <strong>Terms & Conditions</strong> before continuing.
                  </span>
                </label>
              </div>
            <button
              type="submit"
              className="w-full py-1 border border-white text-black bg-white font-semibold rounded-lg hover:bg-green-400 hover:text-black transition-all duration-200 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Registering..." : "REGISTER"}
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
          KASTURI VIJAYAM PRESENTS
        </h2>
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-4 leading-tight">
          [ EVENT NAME ]
        </h1>
        <button
          onClick={() => signIn("google")}
          className="text-sm sm:text-base border border-white text-white font-semibold px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-all duration-200 cursor-pointer"
        >
          REGISTER
        </button>
      </div>
    </div>
  );
}
