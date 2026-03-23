import axios from "axios"
import { HTTP_BACKEND } from "@/config"

const api = axios.create({
  baseURL: HTTP_BACKEND,
  withCredentials: true,
})

export const getGoogleLoginUrl = () => {
  return `${HTTP_BACKEND}/api/auth/google`
}

export const getGithubLoginUrl = () => {
  return `${HTTP_BACKEND}/api/auth/github`
}

export const getMe = async () => {
  const res = await api.get("/api/auth/me")
  return res.data
}

export default api
