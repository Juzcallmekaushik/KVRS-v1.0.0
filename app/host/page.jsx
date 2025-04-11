"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Search, Trash } from "lucide-react";

export default function HostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const allowedEmails = ["host.kvrs@gmail.com"];
  const supabase = createClient();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !allowedEmails.includes(session.user.email)) {
      router.replace("/");
      return;
    }
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (!error) {
        console.log("Fetched users:", data);
        setUsers(data);
        setFilteredUsers(data);
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
    const filtered = users.filter(
      (user) =>
        user.lucky_number?.toString().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.isAuthor?.toString().toLowerCase().includes(query) ||
        user.isDonor?.toString().toLowerCase().includes(query)
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

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;
    try {
      const { error: insertError } = await supabase
        .from("deleted_users")
        .insert([
          {
            lucky_number: selectedUser.lucky_number,
            name: selectedUser.name,
            email: selectedUser.email,
            phonenumber: selectedUser.phone,
            deleted_at: new Date().toISOString(),
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

      setUsers((prev) => prev.filter((u) => u.email !== selectedUser.email));
      setFilteredUsers((prev) => prev.filter((u) => u.email !== selectedUser.email));
      setSelectedUser(null);
      alert("User deleted and archived successfully.");
    } catch (err) {
      console.error("Unexpected error deleting user:", err);
      alert("Something went wrong.");
    }
  };

  const fetchDeletedUsers = async () => {
    const { data, error } = await supabase
      .from("deleted_users")
      .select("id, lucky_number, name, email, phonenumber, deleted_at")
      .order("deleted_at", { ascending: true });

    if (!error) {
      setDeletedUsers(data);
      setShowDeletedModal(true);
    }
  };

  if (status === "loading" || !session) return null;

  if (!allowedEmails.includes(session?.user?.email)) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black text-white">
        <p className="animate-pulse">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative pb-16">
      <div className="flex justify-between items-start mb-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">Host Dashboard</h1>
        <button
          onClick={() => signOut()}
          className="text-red-600 font-semibold hover:text-red-500 transition-all duration-200"
        >
          Logout
        </button>
      </div>

      <div className="absolute top-16 right-6 mt-4 flex items-center gap-2">
        <button onClick={fetchDeletedUsers} className="text-gray-400 hover:text-white">
          <Trash size={18} />
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
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.email}
              className="bg-[#131824] text-white rounded-lg shadow-lg p-3 cursor-pointer hover:bg-gray-200 hover:text-black transition-all duration-200"
              onClick={() => handleBoxClick(user)}
            >
              <h1 className="text-sm text-center font-bold">Lucky Number</h1>
              <h3 className="text-4xl font-black text-center">{user.lucky_number}</h3>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-400">No users found matching your search.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 bg-black text-center">
        <p className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
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
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={handleDeleteUser}
                title="Delete User"
                className="text-red-800 hover:text-red-600 transition-all"
              >
                <Trash size={16} />
              </button>
              <button
                onClick={handleCloseModal}
                title="Close"
                className="text-black text-2xl leading-none hover:text-gray-700 transition-all"
              >
                &times;
              </button>
            </div>
            <h2 className="text-2xl font-semibold mb-4">User Details</h2>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Phone:</strong> {selectedUser.phone}</p>
            <p><strong>IsAuthor:</strong> {selectedUser.isAuthor ? "True" : "False"}</p>
            <p><strong>IsDonor:</strong> {selectedUser.isDonor ? "True" : "False"}</p>
            <p><strong>Lucky Number:</strong> {selectedUser.lucky_number}</p>
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
                className="text-gray-600 hover:text-black text-2xl"
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
                    <th className="py-2 px-4 text-left border border-black">Lucky Number</th>
                    <th className="py-2 px-4 text-left border border-black">Name</th>
                    <th className="py-2 px-4 text-left border border-black">Email</th>
                    <th className="py-2 px-4 text-left border border-black">Phone</th>
                    <th className="py-2 px-4 text-left border border-black">Deleted Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-2 px-4 text-center text-black border border-black">
                        No deleted users found.
                      </td>
                    </tr>
                  ) : (
                    deletedUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="py-2 px-4 border border-black">{user.id}</td>
                        <td className="py-2 px-4 border border-black">{user.lucky_number}</td>
                        <td className="py-2 px-4 border border-black">{user.name}</td>
                        <td className="py-2 px-4 border border-black">{user.email}</td>
                        <td className="py-2 px-4 border border-black">{user.phonenumber}</td>
                        <td className="py-2 px-4 border border-black">
                          {new Date(user.deleted_at).toLocaleString()}
                        </td>
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
