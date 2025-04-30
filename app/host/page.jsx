"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Search, Trash, Mail } from "lucide-react"; // Import the Mail icon

export default function HostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const allowedEmails = [process.env.NEXT_PUBLIC_HOST_EMAIL];
  const supabase = createClient();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !allowedEmails.includes(session.user.email)) {
      router.replace("/");
      return;
    }
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("email, name, phone, lucky_number, is_donor, is_author, is_volunteer, slot, remarks, guestcount");
      if (!error) {
        console.log(data);
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error("Error fetching users:", error.message);
      }
    };
    fetchUsers();
  }, [session, status, router, supabase]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter((user) =>
      user.lucky_number?.toString().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.is_donor?.toString().toLowerCase().includes(query) ||
      user.is_author?.toString().toLowerCase().includes(query) ||
      user.is_volunteer?.toString().toLowerCase().includes(query) ||
      user.slot?.toLowerCase().includes(query) ||
      user.remarks?.toLowerCase().includes(query) ||
      user.guestcount?.toString().includes(query)

    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleBoxClick = (user) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteFromSheets = async (email) => {
    try {
      const response = await fetch("/api/delete-from-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Error deleting user from Google Sheets:", result.error);
        alert("Failed to delete user from Google Sheets.");
        return false;
      }

      console.log("User successfully deleted from Google Sheets.");
      return true;
    } catch (err) {
      console.error("Unexpected error deleting user from Google Sheets:", err);
      alert("Something went wrong while deleting from Google Sheets.");
      return false;
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      const istNow = new Date().toLocaleString("en-US", {
        timeZone: process.env.NEXT_PUBLIC_TIMEZONE
      });

      const { error: insertError } = await supabase
        .from("deleted_users")
        .insert([
          {
            lucky_number: selectedUser.lucky_number,
            name: selectedUser.name,
            email: selectedUser.email,
            phonenumber: selectedUser.phone,
            is_donor: selectedUser.is_donor,
            is_author: selectedUser.is_author,
            is_volunteer: selectedUser.is_volunteer,
            slot: selectedUser.slot,
            guestcount: selectedUser.guestcount,
            deleted_at: istNow,
          },
        ]);

      if (insertError) {
        console.error("Insert to deleted_users failed:", insertError.message);
        alert("Failed to archive lucky number.");
        return;
      }


      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("email", selectedUser.email);

      if (deleteError) {
        console.error("Delete from users failed:", deleteError.message);
        alert("Failed to delete user from Supabase.");
        return;
      }

      const sheetsDeleted = await handleDeleteFromSheets(selectedUser.email);
      if (!sheetsDeleted) {
        alert("User was deleted from Supabase but not from Google Sheets.");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.email !== selectedUser.email));
      setFilteredUsers((prev) => prev.filter((u) => u.email !== selectedUser.email));
      setSelectedUser(null);
    } catch (err) {
      console.error("Unexpected error deleting user:", err);
      alert("Something went wrong.");
    }
  };

  const fetchDeletedUsers = async () => {
    const { data, error } = await supabase
      .from("deleted_users")
      .select("id, lucky_number, name, email, phonenumber, is_donor, is_author, is_volunteer, slot, guestcount, deleted_at")
      .order("deleted_at", { ascending: true });

    if (!error) {
      const formattedData = data.map((user) => ({
        ...user,
        deleted_at: new Date(user.deleted_at).toLocaleString("en-US", {
          timeZone: process.env.NEXT_PUBLIC_TIMEZONE,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).replace(",", ""),
      }));
      setDeletedUsers(formattedData);
      setShowDeletedModal(true);
    } else {
      console.error("Error fetching deleted users:", error.message);
    }
  };

  const handleSendEmails = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("name, email, phone, lucky_number, is_donor, is_author, is_volunteer, slot, remarks, guestcount");

      if (error) {
        console.error("Error fetching user details:", error.message);
        alert("Failed to fetch user details.");
        return;
      }

      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: data }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("Error sending emails:", result.error);
        alert("Failed to send emails.");
        return;
      }

      alert("Emails sent successfully!");
    } catch (err) {
      console.error("Unexpected error while sending emails:", err);
      alert("Something went wrong while sending emails.");
    }
  };

  if (status === "loading" || !session) return null;

  if (!session || !allowedEmails.includes(session.user.email)) {
    router.replace("/register");
    return;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative pb-16">
      <div className="flex justify-between items-start mb-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">Host Dashboard</h1>
        <button
          onClick={() => signOut()}
          className="text-red-600 font-semibold hover:text-red-500 transition-all duration-200 cursor-pointer"
        >
          Logout
        </button>
      </div>

      <div className="absolute top-16 right-6 mt-4 flex items-center gap-2">
        <button onClick={fetchDeletedUsers} className="text-gray-400 hover:text-white cursor-pointer">
          <Trash size={18} />
        </button>
        <button 
          onClick={handleSendEmails} 
          className={`text-gray-400 hover:text-white cursor-pointer ${users.length === 0 ? "opacity-30 cursor-not-allowed" : ""}`}
          disabled={users.length === 0}
        >
          <Mail size={18} />
        </button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="bg-[#404d68] text-white w-48 pl-8 pr-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-0 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {users.length === 0 ? (
          <div className="col-span-full flex justify-center items-center min-h-[50vh]">
            <p className="text-gray-400 text-center">😅 Whoops! No one’s signed up yet — spread the word and get the ball rolling!</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            let boxColor = "bg-[#131824] text-white";

            if (user.slot === "Nutalapati Slot") {
              boxColor = "bg-[#b4a7d6] text-black";
            } else if (user.slot === "Kasturi Vijayam Slot") {
              boxColor = "bg-[#ffe599] text-black";
            } else if (user.slot === "International InkBound Slot") {
              boxColor = "bg-[#6fa8dc] text-black";
            } else if (user.slot === "Singuluri Slot") {
              boxColor = "bg-[#b7e1cd] text-black";
            }

            return (
              <div
                key={user.email}
                className={`rounded-lg shadow-lg p-3 cursor-pointer hover:bg-gray-200 hover:text-black transition-all duration-200 ${boxColor}`}
                onClick={() => handleBoxClick(user)}
              >
                <h1 className="text-sm text-center font-bold">Lucky Number</h1>
                <h3 className="text-4xl font-black text-center">{user.lucky_number}</h3>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex justify-center items-center min-h-[50vh]">
            <p className="text-gray-400 text-center">🔍 No users found matching your search — try adjusting your search terms.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 bg-black text-center">
        <p className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users ({users.reduce((total, user) => total + (user.guestcount || 0), 0)} Guests)
        </p>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 flex justify-center items-center"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white text-black rounded-lg p-6 pt-10 w-96 max-w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={handleDeleteUser}
                title="Delete User"
                className="text-red-800 hover:text-red-600 transition-all cursor-pointer"
              >
                <Trash size={16} />
              </button>
              <button
                onClick={handleCloseModal}
                title="Close"
                className="text-black text-2xl leading-none hover:text-gray-700 transition-all cursor-pointer"
              >
                &times;
              </button>
            </div>
            <h2 className="text-2xl font-semibold mb-4">User Details</h2>
            <p><strong>Name:</strong> {selectedUser.name }</p>
            <p><strong>Email:</strong> {selectedUser.email }</p>
            <p><strong>Phone:</strong> {selectedUser.phone }</p>
            <p><strong>Lucky Number:</strong> {selectedUser.lucky_number }</p>
            <p><strong>Guests:</strong> {selectedUser.guestcount}</p>
            {selectedUser.is_author || selectedUser.is_donor || selectedUser.is_volunteer ? (
              <p>
                <strong>Role:</strong>{" "}
                {[
                  selectedUser.is_author && "Author",
                  selectedUser.is_donor && "Donor",
                  selectedUser.is_volunteer && "Volunteer",
                ]
                  .filter(Boolean)
                  .join(", ")
                  .replace(/, ([^,]*)$/, " & $1") }
              </p>
            ) : null}
            <p><strong>Slot:</strong> {selectedUser.slot}</p>
            {selectedUser.remarks && selectedUser.remarks.trim() && (
              <p><strong>Remarks:</strong> {selectedUser.remarks}</p>
            )}

          </div>
        </div>
      )}

      {showDeletedModal && (
        <div
          className="fixed inset-0 bg-black/80 flex justify-center items-center z-50"
          onClick={() => setShowDeletedModal(false)}
        >
          <div
            className="bg-white text-black rounded-lg p-6 w-auto max-w-5xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}                                                            
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Deleted Users</h2>
              <button
                className="text-gray-600 hover:text-black text-2xl cursor-pointer"
                onClick={() => setShowDeletedModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm border-collapse">
                <thead className="bg-gray-300">
                  <tr>
                    <th className="py-2 px-4 text-left border border-black">ID</th>
                    <th className="py-2 px-4 text-left border border-black">Name</th>
                    <th className="py-2 px-4 text-left border border-black">Email</th>
                    <th className="py-2 px-4 text-left border border-black">Phone</th>
                    <th className="py-2 px-4 text-left border border-black">Lucky Number</th>
                    <th className="py-2 px-4 text-left border border-black">IsDonor?</th>
                    <th className="py-2 px-4 text-left border border-black">IsAuthor?</th>
                    <th className="py-2 px-4 text-left border border-black">IsVolunteer?</th>
                    <th className="py-2 px-4 text-left border border-black">Slot Booked</th>
                    <th className="py-2 px-4 text-left border border-black">Guest Count</th>
                    <th className="py-2 px-4 text-left border border-black">Deleted Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-2 px-4 text-center text-black border border-black">
                        No deleted users found.
                      </td>
                    </tr>
                  ) : (
                    deletedUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="py-2 px-4 border border-black">{user.id}</td>
                        <td className="py-2 px-4 border border-black">{user.name}</td>
                        <td className="py-2 px-4 border border-black">{user.email}</td>
                        <td className="py-2 px-4 border border-black">{user.phonenumber}</td>
                        <td className="py-2 px-4 border border-black">{user.lucky_number}</td>
                        <td className="py-2 px-4 border border-black">{user.is_donor ? "Yes" : "No"}</td>
                        <td className="py-2 px-4 border border-black">{user.is_author ? "Yes" : "No"}</td>
                        <td className="py-2 px-4 border border-black">{user.is_volunteer ? "Yes" : "No"}</td>
                        <td className="py-2 px-4 border border-black">{user.slot}</td>
                        <td className="py-2 px-4 border border-black">{user.guestcount}</td>
                        <td className="py-2 px-4 border border-black">{user.deleted_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


