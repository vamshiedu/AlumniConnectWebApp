import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import {
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  MapPinIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const AlumniCard = ({
  alumni,
  onFollow,
  onMessage,
  onViewProfile,
  isFollowing = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);

  // Keep local state synchronized if parent changes it
  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  // =========================================================
  // FOLLOW / UNFOLLOW
  // =========================================================

  const handleFollow = async () => {
    if (!alumni?._id) {
      console.error("User ID not found");
      return;
    }

    setIsLoading(true);

    try {
      await onFollow(alumni._id);

      // Since Network.jsx removes the user from Discover
      // after following, this is mainly useful if the card
      // is reused somewhere else.
      setFollowing(true);

    } catch (error) {
      console.error("Follow failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // MESSAGE
  // =========================================================

  const handleMessage = () => {
    if (!alumni?._id) return;

    onMessage(alumni._id);
  };

  // =========================================================
  // VIEW PROFILE
  // =========================================================

  const handleViewProfile = () => {
    if (!alumni?._id) return;

    onViewProfile(alumni._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="text-center mb-4">

        {/* Avatar */}
        <div className="relative inline-block mb-3">

          <Avatar
            src={alumni.avatar}
            name={alumni.name}
            size="xl"
            className="mx-auto"
          />

          {alumni.isOnline && (
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
          )}

        </div>


        {/* Name */}
        <h3
          onClick={handleViewProfile}
          className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
        >
          {alumni.name}
        </h3>


        {/* Bio / Position */}
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {alumni.currentPosition || alumni.bio || "AlumniConnect member"}
        </p>


        {/* Role */}
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
            alumni.role === "alumni"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {alumni.role === "alumni" ? "Alumni" : "Student"}
        </span>

      </div>


      {/* ================================================= */}
      {/* DETAILS */}
      {/* ================================================= */}

      <div className="space-y-2 mb-4">

        {/* Department + Batch */}
        <div className="flex items-center text-sm text-gray-500">

          <AcademicCapIcon className="h-4 w-4 mr-2 flex-shrink-0" />

          <span className="truncate">
            {alumni.department || "Department"}
            {alumni.batch && ` • ${alumni.batch}`}
          </span>

        </div>


        {/* Current Position */}
        {alumni.role === "alumni" &&
          alumni.currentPosition && (
            <div className="flex items-center text-sm text-gray-500">

              <BriefcaseIcon className="h-4 w-4 mr-2 flex-shrink-0" />

              <span className="truncate">
                {alumni.currentPosition}
              </span>

            </div>
          )}


        {/* Location */}
        {alumni.location && (
          <div className="flex items-center text-sm text-gray-500">

            <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />

            <span className="truncate">
              {alumni.location}
            </span>

          </div>
        )}


        {/* Skills */}
        {alumni.skills &&
          alumni.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">

              {alumni.skills
                .slice(0, 3)
                .map((skill, index) => {

                  // Your schema stores skills as objects:
                  // { name, endorsedBy }

                  const skillName =
                    typeof skill === "string"
                      ? skill
                      : skill.name;

                  return (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      {skillName}
                    </span>
                  );
                })}

              {alumni.skills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  +{alumni.skills.length - 3} more
                </span>
              )}

            </div>
          )}


        {/* Followers */}
        <div className="text-center pt-2">

          <p className="text-sm text-gray-500">

            {alumni.followers?.length || 0} followers

          </p>

        </div>

      </div>


      {/* ================================================= */}
      {/* ACTION BUTTONS */}
      {/* ================================================= */}

      <div className="flex space-x-2">

        {/* Follow */}
        <Button
          onClick={handleFollow}
          loading={isLoading}
          variant={following ? "secondary" : "primary"}
          size="sm"
          className="flex-1 flex items-center justify-center space-x-1"
        >

          {following ? (
            <>
              <CheckIcon className="h-4 w-4" />

              <span>
                Following
              </span>
            </>
          ) : (
            <>
              <UserPlusIcon className="h-4 w-4" />

              <span>
                Follow
              </span>
            </>
          )}

        </Button>


        {/* Message */}
        <Button
          onClick={handleMessage}
          variant="outline"
          size="sm"
          className="flex items-center justify-center px-3"
          title="Send Message"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
        </Button>

      </div>


      {/* ================================================= */}
      {/* HOVER EFFECT */}
      {/* ================================================= */}

      <div className="absolute inset-0 bg-gradient-to-t from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/20 group-hover:to-blue-50/5 rounded-xl transition-all duration-300 pointer-events-none" />

    </motion.div>
  );
};

export default AlumniCard;