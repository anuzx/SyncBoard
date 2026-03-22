import { GitHub, Google } from "arctic";
import { env } from "./env.js"

export const github = new GitHub(
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET!,
  "http://localhost:3001/github/callaback"
);

export const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3001/google/callback"
);
