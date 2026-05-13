import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

const getPrimaryEmailAddress = (clerkUser) => {
    const primaryEmail = clerkUser.emailAddresses?.find(
        (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    return primaryEmail || clerkUser.emailAddresses?.[0]?.emailAddress || "";
};

export const buildDisplayName = ({
    firstName = "",
    lastName = "",
    fullName = "",
    username = "",
    email = "",
}) => {
    const combinedName = `${firstName} ${lastName}`.trim();

    if (combinedName) return combinedName;
    if (fullName?.trim()) return fullName.trim();
    if (username?.trim()) return username.trim();
    if (email) return email.split("@")[0];

    return "Unknown user";
};

export const syncClerkUserToMongo = async (userId) => {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = getPrimaryEmailAddress(clerkUser);

    const userData = {
        _id: clerkUser.id,
        email,
        name: buildDisplayName({
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            fullName: clerkUser.fullName,
            username: clerkUser.username,
            email,
        }),
        image: clerkUser.imageUrl || "",
    };

    await User.findByIdAndUpdate(userId, userData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });

    return userData;
};
