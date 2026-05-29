import { createServerFn } from "@tanstack/react-start";

export const getInstagramStats = createServerFn({ method: "GET" })
  .inputValidator((data: { username: string }) => {
    if (!data?.username || !/^[a-zA-Z0-9._]{1,40}$/.test(data.username)) {
      throw new Error("Invalid username");
    }
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const res = await fetch(
        `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(data.username)}`,
        {
          headers: {
            "User-Agent": "Instagram 219.0.0.12.117 Android",
            "x-ig-app-id": "936619743392459",
            Accept: "application/json",
          },
        },
      );
      if (!res.ok) {
        return { followers: null, following: null, posts: null, error: `HTTP ${res.status}` };
      }
      const json = (await res.json()) as {
        data?: {
          user?: {
            edge_followed_by?: { count: number };
            edge_follow?: { count: number };
            edge_owner_to_timeline_media?: { count: number };
            full_name?: string;
            profile_pic_url?: string;
            is_verified?: boolean;
          };
        };
      };
      const user = json?.data?.user;
      if (!user) return { followers: null, following: null, posts: null, error: "Not found" };
      return {
        username: data.username,
        fullName: user.full_name ?? null,
        profilePic: user.profile_pic_url ?? null,
        isVerified: user.is_verified ?? false,
        followers: user.edge_followed_by?.count ?? null,
        following: user.edge_follow?.count ?? null,
        posts: user.edge_owner_to_timeline_media?.count ?? null,
        error: null,
      };
    } catch (e) {
      return {
        followers: null,
        following: null,
        posts: null,
        error: e instanceof Error ? e.message : "Failed",
      };
    }
  });

export const getInstagramProfiles = createServerFn({ method: "POST" })
  .inputValidator((usernames: string[]) => {
    if (!Array.isArray(usernames)) throw new Error("Expected array of usernames");
    return usernames;
  })
  .handler(async ({ data: usernames }) => {
    const results: Record<string, { profilePic: string | null; fullName: string | null }> = {};
    
    await Promise.all(
      usernames.map(async (username) => {
        try {
          const res = await fetch(
            `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
            {
              headers: {
                "User-Agent": "Instagram 219.0.0.12.117 Android",
                "x-ig-app-id": "936619743392459",
                Accept: "application/json",
              },
            },
          );
          if (res.ok) {
            const json = await res.json();
            const user = json?.data?.user;
            if (user) {
              results[username] = {
                profilePic: user.profile_pic_url ?? null,
                fullName: user.full_name ?? null,
              };
            }
          }
        } catch (e) {
          console.error(`Failed to fetch profile for ${username}:`, e);
        }
      })
    );
    
    return results;
  });
