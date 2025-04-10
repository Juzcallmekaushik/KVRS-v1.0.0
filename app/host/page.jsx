"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { Search } from "lucide-react"

export default function HostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const hostEmail = process.env.NEXT_PUBLIC_HOST_EMAIL || ""
  const supabase = createClient()

  // Fetch users if authorized
  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.email.toLowerCase() !== hostEmail.toLowerCase()) {
      return
    }

    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*")
      if (error) {
        console.error("Error fetching users:", error.message)
      } else {
        setUsers(data)
        setFilteredUsers(data)
      }
    }

    fetchUsers()
  }, [session, status, supabase, hostEmail])

  // Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = users.filter(
      (user) =>
        user.lucky_number?.toString().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
    )

    setFilteredUsers(filtered)
  }, [searchQuery, users])

  // Redirect if not authorized
  useEffect(() => {
    if (session && session.user.email.toLowerCase() !== hostEmail.toLowerCase()) {
      const timer = setTimeout(() => {
        router.replace("/register")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [session, router, hostEmail])

  const handleBoxClick = (user) => setSelectedUser(user)
  const handleCloseModal = () => setSelectedUser(null)
  const handleSearch = (e) => setSearchQuery(e.target.value)

  if (status === "loading" || !session) return null

  if (session.user.email.toLowerCase() !== hostEmail.toLowerCase()) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black text-white">
        <p className="animate-pulse text-center">
          Access Denied<br />
          Redirecting to registration page...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative pb-16">
      {/* Header */}
      <div className="flex justify-between items-start mb-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">Host Dashboard</h1>
        <button
          onClick={() => signOut()}
          className="text-red-600 font-semibold hover:text-red-500 transition-all duration-200"
        >
          Logout
        </button>
      </div>

      {/* Search Bar */}
      <div className="absolute top-16 right-6 mt-4">
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

      {/* User Cards */}
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

      {/* Count */}
      <div className="fixed bottom-0 left-0 right-0 py-3 bg-black text-center">
        <p className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {/* User Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 flex justify-center items-center"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white text-black rounded-lg p-6 w-96 max-w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleCloseModal} className="absolute top-0.5 right-2 text-black font-normal text-2xl">
              &times;
            </button>
            <h2 className="text-2xl font-semibold mb-4">User Details</h2>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Phone:</strong> {selectedUser.phone}</p>
            <p><strong>Lucky Number:</strong> {selectedUser.lucky_number}</p>
          </div>
        </div>
      )}
    </div>
  )
}
