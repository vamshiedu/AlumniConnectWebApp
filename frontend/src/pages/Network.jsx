import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AlumniCard from "../components/network/AlumniCard";
import ConnectionCard from "../components/network/ConnectionCard";
import Button from "../components/common/Button";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const Network = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("discover");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const [people, setPeople] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // FETCH NETWORK DATA
  // =========================================================

  const fetchNetworkData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        discoverResponse,
        followersResponse,
        followingResponse,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/network/discover", {
          headers,
        }),

        fetch("http://localhost:5000/api/network/followers", {
          headers,
        }),

        fetch("http://localhost:5000/api/network/following", {
          headers,
        }),
      ]);

      if (
        !discoverResponse.ok ||
        !followersResponse.ok ||
        !followingResponse.ok
      ) {
        throw new Error("Failed to fetch network data");
      }

      const discoverData = await discoverResponse.json();
      const followersData = await followersResponse.json();
      const followingData = await followingResponse.json();

      setPeople(discoverData);
      setFollowers(followersData);
      setFollowing(followingData);

    } catch (error) {
      console.error("Network data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, []);

  // =========================================================
  // FOLLOW USER
  // =========================================================

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/user/follow/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to follow user");
      }

      // Find the person we just followed
      const followedUser = people.find(
        (person) => person._id === userId
      );

      if (followedUser) {
        // Add to following
        setFollowing((prev) => {
          const alreadyFollowing = prev.some(
            (user) => user._id === userId
          );

          if (alreadyFollowing) {
            return prev;
          }

          return [...prev, followedUser];
        });

        // Remove from discover
        setPeople((prev) =>
          prev.filter((person) => person._id !== userId)
        );
      }

    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  // =========================================================
  // UNFOLLOW USER
  // =========================================================

  const handleUnfollow = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/user/follow/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unfollow user");
      }

      // Remove from following
      setFollowing((prev) =>
        prev.filter((user) => user._id !== userId)
      );

      // Refresh only network data.
      // No full page reload.
      const discoverResponse = await fetch(
        "http://localhost:5000/api/network/discover",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (discoverResponse.ok) {
        const discoverData = await discoverResponse.json();
        setPeople(discoverData);
      }

    } catch (error) {
      console.error("Unfollow error:", error);
    }
  };

  // =========================================================
  // MESSAGE
  // =========================================================

  const handleMessage = (userId) => {
    console.log("Starting conversation with user:", userId);
    navigate("/messages");
  };

  // =========================================================
  // VIEW PROFILE
  // =========================================================

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // =========================================================
  // DEPARTMENTS
  // =========================================================

  const departments = [
    "Computer Science",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Business Administration",
  ];

  // =========================================================
  // GET PEOPLE NOT ALREADY FOLLOWING
  // =========================================================

  const followingIds = new Set(
    following.map((user) => user._id?.toString())
  );

  const discoverPeople = people.filter(
    (person) =>
      !followingIds.has(person._id?.toString())
  );

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredPeople = discoverPeople.filter((person) => {
    const name = person.name?.toLowerCase() || "";
    const department =
      person.department?.toLowerCase() || "";
    const role = person.role?.toLowerCase() || "";

    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      name.includes(query) ||
      department.includes(query);

    const matchesRole =
      filterRole === "all" ||
      role === filterRole;

    const matchesDepartment =
      filterDepartment === "all" ||
      person.department === filterDepartment;

    return (
      matchesSearch &&
      matchesRole &&
      matchesDepartment
    );
  });

  // =========================================================
  // TABS
  // =========================================================

  const tabs = [
    {
      id: "discover",
      name: "Discover People",
      count: filteredPeople.length,
    },
    {
      id: "followers",
      name: "Followers",
      count: followers.length,
    },
    {
      id: "following",
      name: "Following",
      count: following.length,
    },
    {
      id: "requests",
      name: "Requests",
      count: 0,
    },
  ];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">
            Loading network...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="max-w-7xl mx-auto">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">

          <h1 className="text-3xl font-bold text-gray-900">
            Network
          </h1>

        </div>

        <p className="text-gray-600">
          Discover alumni and fellow students, follow people,
          and grow your professional network.
        </p>
      </motion.div>


      {/* ================================================= */}
      {/* SEARCH + FILTERS */}
      {/* ================================================= */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"
      >

        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">

          {/* Search */}
          <div className="flex-1 relative">

            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search people by name or department..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

          </div>


          {/* Role */}
          <select
            value={filterRole}
            onChange={(e) =>
              setFilterRole(e.target.value)
            }
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >

            <option value="all">
              All Roles
            </option>

            <option value="alumni">
              Alumni
            </option>

            <option value="student">
              Students
            </option>

          </select>


          {/* Department */}
          <select
            value={filterDepartment}
            onChange={(e) =>
              setFilterDepartment(e.target.value)
            }
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >

            <option value="all">
              All Departments
            </option>

            {departments.map((department) => (
              <option
                key={department}
                value={department}
              >
                {department}
              </option>
            ))}

          </select>

        </div>

      </motion.div>


      {/* ================================================= */}
      {/* TABS */}
      {/* ================================================= */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6"
      >

        <div className="border-b border-gray-200">

          <nav className="flex space-x-8 px-6">

            {tabs.map((tab) => (

              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >

                {tab.name}

                <span className="ml-2 py-0.5 px-2 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {tab.count}
                </span>

              </button>

            ))}

          </nav>

        </div>


        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="p-6">

          {/* =============================================== */}
          {/* DISCOVER */}
          {/* =============================================== */}

          {activeTab === "discover" && (

            <div>

              {filteredPeople.length > 0 ? (

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                  {filteredPeople.map((person, index) => (

                    <motion.div
                      key={person._id}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.1,
                      }}
                    >

                      <AlumniCard
                        alumni={person}
                        onFollow={handleFollow}
                        onMessage={handleMessage}
                        onViewProfile={handleViewProfile}
                        isFollowing={false}
                      />

                    </motion.div>

                  ))}

                </div>

              ) : (

                <div className="text-center py-12">

                  <UserPlusIcon
                    className="h-12 w-12 text-gray-400 mx-auto mb-4"
                  />

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No people found
                  </h3>

                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria.
                  </p>

                </div>

              )}

            </div>

          )}


          {/* =============================================== */}
          {/* FOLLOWERS */}
          {/* =============================================== */}

          {activeTab === "followers" && (

            <div>

              {followers.length > 0 ? (

                <div className="space-y-4">

                  {followers.map((person, index) => (

                    <motion.div
                      key={person._id}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.05,
                      }}
                    >

                      <ConnectionCard
                        connection={person}
                        onMessage={handleMessage}
                        onViewProfile={handleViewProfile}
                        layout="horizontal"
                        showLastActivity={false}
                      />

                    </motion.div>

                  ))}

                </div>

              ) : (

                <div className="text-center py-12">

                  <UserPlusIcon
                    className="h-12 w-12 text-gray-400 mx-auto mb-4"
                  />

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No followers yet
                  </h3>

                  <p className="text-gray-500">
                    People who follow you will appear here.
                  </p>

                </div>

              )}

            </div>

          )}


          {/* =============================================== */}
          {/* FOLLOWING */}
          {/* =============================================== */}

          {activeTab === "following" && (

            <div>

              {following.length > 0 ? (

                <div className="space-y-4">

                  {following.map((person, index) => (

                    <motion.div
                      key={person._id}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.05,
                      }}
                    >

                      <ConnectionCard
                        connection={person}
                        onMessage={handleMessage}
                        onDisconnect={handleUnfollow}
                        onViewProfile={handleViewProfile}
                        layout="horizontal"
                        showLastActivity={false}
                      />

                    </motion.div>

                  ))}

                </div>

              ) : (

                <div className="text-center py-12">

                  <UserPlusIcon
                    className="h-12 w-12 text-gray-400 mx-auto mb-4"
                  />

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Not following anyone yet
                  </h3>

                  <p className="text-gray-500 mb-4">
                    Start building your network by following
                    alumni and students.
                  </p>

                  <Button
                    onClick={() =>
                      setActiveTab("discover")
                    }
                  >
                    Discover People
                  </Button>

                </div>

              )}

            </div>

          )}


          {/* =============================================== */}
          {/* REQUESTS */}
          {/* =============================================== */}

          {activeTab === "requests" && (

            <div className="text-center py-12">

              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">

                <UserPlusIcon
                  className="h-8 w-8 text-gray-400"
                />

              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending requests
              </h3>

              <p className="text-gray-500">
                Connection requests will appear here when
                you receive them.
              </p>

            </div>

          )}

        </div>

      </motion.div>

    </div>
  );
};

export default Network;