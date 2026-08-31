import { useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api";
import { Section } from "../../components/UI";

const emptyForm = {
  name: "",
  email: "",
  countryCode: "+91",
  mobile: "",
  password: "",
  confirmPassword: "",
};

export function StaffPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  async function load() {
    try {
      const res = await api.get("/staff", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      setRows(res.data.data?.data || []);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("/staff", form);

      setMessage("Staff created successfully.");
      resetForm();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function updateStaff(e: React.FormEvent) {
    e.preventDefault();

    if (!editingId) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.patch(`/staff/${editingId}`, {
        name: form.name,
        email: form.email,
        countryCode: form.countryCode,
        mobile: form.mobile,
      });

      setMessage("Staff updated successfully.");
      resetForm();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function editStaff(staff: any) {
    setEditingId(staff._id);

    setForm({
      name: staff.name || "",
      email: staff.email || "",
      countryCode: staff.countryCode || "+91",
      mobile: staff.mobile || "",
      password: "",
      confirmPassword: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function toggleStatus(staff: any) {
    setError("");
    setMessage("");

    try {
      await api.patch(`/staff/${staff._id}/status`, {
        isActive: !staff.isActive,
      });

      setMessage(
        staff.isActive
          ? "Staff deactivated."
          : "Staff activated."
      );

      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function deleteStaff(staff: any) {
    if (
      !confirm(
        `Delete staff "${staff.name}"?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/staff/${staff._id}`);

      setMessage("Staff deleted.");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function resetPassword(staff: any) {
    const password = window.prompt(
      `Enter new password for ${staff.name}`
    );

    if (!password) return;

    const confirmPassword = window.prompt(
      "Confirm new password"
    );

    if (!confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.patch(
        `/staff/${staff._id}/reset-password`,
        {
          password,
          confirmPassword,
        }
      );

      setMessage("Password reset successfully.");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <>
      <div className="title">
        <div>
          <h1>Staff Management</h1>
          <p>
            Create and manage staff accounts.
          </p>
        </div>
      </div>

      {(error || message) && (
        <div className={error ? "error" : "success"}>
          {error || message}
        </div>
      )}

      <Section
        title={
          editingId
            ? "Edit Staff"
            : "Create Staff"
        }
      >
        <form
          className="grid-form"
          onSubmit={
            editingId
              ? updateStaff
              : createStaff
          }
        >
          <input
            required
            placeholder="Name *"
            value={form.name}
            onChange={(e) =>
              set("name", e.target.value)
            }
          />

          <input
            required
            type="email"
            placeholder="SELCO email *"
            value={form.email}
            onChange={(e) =>
              set("email", e.target.value)
            }
          />

          <input
            placeholder="Country code"
            value={form.countryCode}
            onChange={(e) =>
              set(
                "countryCode",
                e.target.value
              )
            }
          />

          <input
            required
            placeholder="10 digit mobile *"
            value={form.mobile}
            onChange={(e) =>
              set("mobile", e.target.value)
            }
          />

          {!editingId && (
            <>
              <input
                required
                type="password"
                placeholder="Password *"
                value={form.password}
                onChange={(e) =>
                  set(
                    "password",
                    e.target.value
                  )
                }
              />

              <input
                required
                type="password"
                placeholder="Confirm password *"
                value={form.confirmPassword}
                onChange={(e) =>
                  set(
                    "confirmPassword",
                    e.target.value
                  )
                }
              />
            </>
          )}

          <div className="full">
            <button
              className="primary"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Staff"
                : "Create Staff"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Section>

      <Section title="Staff List">
        {rows.length === 0 ? (
          <div className="empty">
            No staff found.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((staff) => (
                  <tr key={staff._id}>
                    <td>{staff.name}</td>

                    <td>{staff.email}</td>

                    <td>
                      {staff.countryCode}{" "}
                      {staff.mobile}
                    </td>

                    <td>{staff.role}</td>

                    <td>
                      {staff.isActive
                        ? "Active"
                        : "Inactive"}
                    </td>

                    <td>
                      <button
                        onClick={() =>
                          editStaff(staff)
                        }
                      >
                        Edit
                      </button>{" "}

                      <button
                        onClick={() =>
                          toggleStatus(staff)
                        }
                      >
                        {staff.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>{" "}

                      <button
                        onClick={() =>
                          resetPassword(staff)
                        }
                      >
                        Reset Password
                      </button>{" "}

                      <button
                        onClick={() =>
                          deleteStaff(staff)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}