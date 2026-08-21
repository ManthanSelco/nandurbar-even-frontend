import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("pj_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const registrationToken = sessionStorage.getItem("registration_token");
  if (registrationToken) config.headers["X-Registration-Token"] = registrationToken;

  const volunteerToken = sessionStorage.getItem("volunteer_token");
  if (volunteerToken) config.headers["X-Volunteer-Token"] = volunteerToken;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url || "");
    if (
      error.response?.status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/registration") &&
      !url.includes("/volunteer/")
    ) {
      sessionStorage.removeItem("pj_token");
      sessionStorage.removeItem("pj_staff");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (e: any) =>
  e?.response?.data?.message ||
  e?.response?.data?.errors?.formErrors?.join(", ") ||
  e?.message ||
  "Something went wrong.";
