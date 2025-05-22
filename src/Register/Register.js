import React, { useState } from "react";
import "./Register.css";

const roles = ["Admin", "HR", "Employee"];
const departments = [
    "Front Desk", "Housekeeping", "Kitchen", "Maintenance",
    "Security", "Management", "Other",
];
const employmentTypes = ["Full-Time", "Part-Time", "Contract"];

export default function MultiStepRegister() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        profilePic: null,
        employeeId: "",
        role: "",
        department: "",
        designation: "",
        dateOfJoining: "",
        shiftTiming: "",
        employmentType: "",
        password: "",
        confirmPassword: ""
    });
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            setForm({ ...form, [name]: files[0] });
            setPreview(URL.createObjectURL(files[0]));
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const nextStep = () => {
        setError("");
        if (step === 1 && (!form.fullName || !form.email || !form.phone)) {
            setError("Please fill all required fields.");
            return;
        }
        if (step === 2 && (!form.employeeId || !form.role || !form.department || !form.designation || !form.dateOfJoining)) {
            setError("Please complete the employment details.");
            return;
        }
        setStep((prev) => prev + 1);
    };

    const prevStep = () => setStep((prev) => prev - 1);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        alert("Registration Successful!");
        console.log(form);
    };

    return (
        <div className="register-container">
            <form className="register-form" onSubmit={handleSubmit}>
                <h2>User Registration</h2>

                {step === 1 && (
                    <>
                        <h3 className="form-section-title">Step 1: Basic Information</h3>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input name="fullName" value={form.fullName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Profile Picture</label>
                            <input type="file" name="profilePic" accept="image/*" onChange={handleChange} />
                            {preview && <img src={preview} alt="preview" className="preview-img" />}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h3 className="form-section-title">Step 2: Employment Details</h3>
                        <div className="form-group">
                            <label>Employee ID</label>
                            <input name="employeeId" value={form.employeeId} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select name="role" value={form.role} onChange={handleChange} required>
                                <option value="">Select Role</option>
                                {roles.map((r) => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <select name="department" value={form.department} onChange={handleChange} required>
                                <option value="">Select Department</option>
                                {departments.map((d) => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Designation</label>
                            <input name="designation" value={form.designation} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Date of Joining</label>
                            <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Shift Timing</label>
                            <input name="shiftTiming" value={form.shiftTiming} onChange={handleChange} placeholder="e.g. 9am - 5pm" />
                        </div>
                        <div className="form-group">
                            <label>Employment Type</label>
                            <select name="employmentType" value={form.employmentType} onChange={handleChange} required>
                                <option value="">Select Type</option>
                                {employmentTypes.map((e) => <option key={e}>{e}</option>)}
                            </select>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h3 className="form-section-title">Step 3: Credentials</h3>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
                        </div>
                    </>
                )}

                {error && <div className="error">{error}</div>}

                <div style={{ marginTop: 16 }}>
                    {step > 1 && <button type="button" onClick={prevStep} className="register-button" style={{ marginRight: 8 }}>Back</button>}
                    {step < 3
                        ? <button type="button" onClick={nextStep} className="register-button">Next</button>
                        : <button type="submit" className="register-button">Register</button>
                    }
                </div>
            </form>
        </div>
    );
}
