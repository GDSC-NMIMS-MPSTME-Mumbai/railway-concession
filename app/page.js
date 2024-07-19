"use client";
import { useState, useEffect } from "react";
import supabase from "./lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SuccessPage from "@/components/SuccessPage";

export default function Home() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    school: "MPSTME",
    sapId: "",
    contact: "",
    gender: "",
    dob: "",
    age: "",
    course: "",
    stream: "",
    year: "",
    classForPass: "",
    passPeriod: "",
    railwayType: "",
    station: "",
    collectiondate: "",
    timeslot: "",
  });

  const [errors, setErrors] = useState({
    sapId: "",
    contact: "",
    dob: "",
  });

  const [timeslots, setTimeslots] = useState([
    {
      value: "11.00 AM TO 12.00 PM",
      label: "11.00 AM TO 12.00 PM",
      disabled: false,
    },
    {
      value: "12.00 PM TO 1.00 PM",
      label: "12.00 PM TO 1.00 PM",
      disabled: false,
    },
    {
      value: "2.00 PM TO 3.00 PM",
      label: "2.00 PM TO 3.00 PM",
      disabled: false,
    },
    {
      value: "3.00 PM TO 4.00 PM",
      label: "3.00 PM TO 4.00 PM",
      disabled: false,
    },
  ]);

  const fetchSlotAvailability = async (date) => {
    const { data: slots, error } = await supabase
      .from("slots")
      .select("timeslot, count")
      .eq("collectiondate", date);

    if (error) {
      console.error("Error fetching slot availability:", error.message);
      return [];
    }

    const updatedSlots = timeslots.map((slot) => {
      const slotData = slots.find((s) => s.timeslot === slot.value);
      return {
        ...slot,
        disabled: !(slotData === undefined || slotData?.count < 60),
      };
    });

    setTimeslots(updatedSlots);
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const years = today.getFullYear() - birthDate.getFullYear();
    const months = today.getMonth() - birthDate.getMonth();
    const totalMonths = years * 12 + months;

    const ageYears = Math.floor(totalMonths / 12);
    const ageMonths = totalMonths % 12;

    return { ageYears, ageMonths };
  };
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "sapId") {
      setErrors((prevErrors) => ({
        ...prevErrors,
        sapId: value.length !== 11 ? "SAP ID should be 11 digits" : "",
      }));
    }

    if (name === "contact") {
      setErrors((prevErrors) => ({
        ...prevErrors,
        contact: value.length !== 10 ? "Mobile number should be 10 digits" : "",
      }));
    }

    if (name === "dob") {
      const { ageYears, ageMonths } = calculateAge(value);
      if (ageYears < 14 || ageYears > 25) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          dob: "Age should be between 14 and 25 years",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          dob: "",
        }));
        setFormData({
          ...formData,
          dob: value,
          age: `${ageYears} years ${ageMonths} months`,
        });
      }
    }

    if (name === "collectiondate") {
      const selectedDate = new Date(value);
      const today = new Date();
      const twoDaysLater = new Date(today);
      twoDaysLater.setDate(today.getDate() + 2);

      if (selectedDate < twoDaysLater) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          collectiondate:
            "Collection date must be at least two days from today",
        }));
      } else if (isWeekend(selectedDate)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          collectiondate: "Collection date cannot be on a Saturday or Sunday",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          collectiondate: "",
        }));
        fetchSlotAvailability(value);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emptyFields = Object.keys(formData).filter((key) => !formData[key]);

    if (emptyFields.length > 0) {
      alert(
        `Please fill in all the fields. Missing: ${emptyFields.join(", ")}`
      );
      return;
    }
    setIsLoading(true);

    await fetchSlotAvailability(formData.collectiondate);

    const dataToInsert = {
      firstname: formData.firstName,
      lastname: formData.lastName,
      address: formData.address,
      school: formData.school,
      sapid: formData.sapId,
      contact: formData.contact,
      gender: formData.gender,
      dob: formData.dob,
      age: formData.age,
      course: formData.course,
      stream: formData.stream,
      year: formData.year,
      classforpass: formData.classForPass,
      passperiod: formData.passPeriod,
      railwaytype: formData.railwayType,
      station: formData.station,
      collectiondate: formData.collectiondate,
      timeslot: formData.timeslot,
    };

    const { data, error } = await supabase
      .from("form_submissions")
      .insert([dataToInsert]);

    if (error) {
      alert("An error occured: ", error.message);
      console.error("Error inserting data:", error.message);
    } else {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_APPSCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          mode: "no-cors",
        });

        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }

        const data = await response.json();
        setPostData(data);
      } catch (error) {}

      setIsLoading(false);
      setIsSubmitted(true);

      console.log("Data inserted successfully:", data);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  if (isSubmitted) {
    return <SuccessPage formData={formData} />;
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div role="status">
          <svg
            aria-hidden="true"
            class="inline w-24 h-24 text-gray-200 animate-spin dark:text-gray-600 fill-[#23A6F0]"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <>
      <main className="flex min-h-screen flex-col items-center z-0 bg-[#1E1E1E] justify-between p-6">
        <h1 className=" text-2xl font-black my-4 ">Railway Concession </h1>
        <form onSubmit={handleSubmit} className="space-y-4 w-full p-6 max-w-lg">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="border p-2 w-full"
              rows="3"
              required
            />
          </div>
          <div>
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              name="school"
              value={formData.school}
              onChange={handleChange}
              placeholder="School"
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <Label htmlFor="sapId">SAP ID</Label>
            <Input
              id="sapId"
              name="sapId"
              value={formData.sapId}
              onChange={handleChange}
              placeholder="SAP ID"
              className={`border p-2 w-full ${
                errors.sapId && "border-red-500"
              }`}
              type="number"
              required
            />
            {errors.sapId && (
              <p className="text-red-500 text-sm my-3">{errors.sapId}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contact">Mobile Number</Label>
            <Input
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="Mobile Number"
              className={`border p-2 w-full ${
                errors.contact ? "border-red-500" : ""
              }`}
              type="number"
              required
            />
            {errors.contact && (
              <p className="text-red-500 text-sm my-3">{errors.contact}</p>
            )}
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              name="gender"
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              placeholder="Date of Birth"
              className="border p-2 flex justify-around min-w-full"
              type="date"
              required
            />
            {errors.dob && <p className="text-red-400 my-3">{errors.dob}</p>}
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age"
              className="border p-2 w-full"
              required
              disabled
            />
          </div>
          <div>
            <Label htmlFor="course">Course</Label>

            <Select
              id="course"
              name="course"
              value={formData.course}
              onValueChange={(value) => handleSelectChange("course", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B TECH">B TECH</SelectItem>
                <SelectItem value="B TECH (INTEGRATED)">
                  B TECH (INTEGRATED)
                </SelectItem>
                <SelectItem value="MBA TECH">MBA TECH</SelectItem>
                <SelectItem value="MCA">MCA</SelectItem>
                <SelectItem value="M TECH">M TECH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stream">Stream</Label>
            <Select
              id="stream"
              name="stream"
              value={formData.stream}
              onValueChange={(value) => handleSelectChange("stream", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARTIFICIAL INTELLIGENCE">
                  ARTIFICIAL INTELLIGENCE
                </SelectItem>
                <SelectItem value="CIVIL">CIVIL</SelectItem>
                <SelectItem value="COMPUTER ENGINEERING">
                  COMPUTER ENGINEERING
                </SelectItem>
                <SelectItem value="COMPUTER SCIENCE & BUSINESS SYSTEMS">
                  COMPUTER SCIENCE & BUSINESS SYSTEMS
                </SelectItem>
                <SelectItem value="COMPUTER SCIENCE & ENGINEERING DATA SCIENCE (311)">
                  COMPUTER SCIENCE & ENGINEERING DATA SCIENCE (311)
                </SelectItem>
                <SelectItem value="CYBER SECURITY">CYBER SECURITY</SelectItem>
                <SelectItem value="DATA SCIENCE">DATA SCIENCE</SelectItem>
                <SelectItem value="ELECTRONICS & TELECOMMUNICATION">
                  ELECTRONICS & TELECOMMUNICATION
                </SelectItem>
                <SelectItem value="INFORMATION TECHNOLOGY">
                  INFORMATION TECHNOLOGY
                </SelectItem>
                <SelectItem value="MECHANICAL">MECHANICAL</SelectItem>
                <SelectItem value="MECHATRONICS">MECHATRONICS</SelectItem>
                <SelectItem value="MCA">MCA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Select
              id="year"
              name="year"
              value={formData.year}
              onValueChange={(value) => handleSelectChange("year", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="classForPass">Class for Railway Pass</Label>
            <Select
              id="classForPass"
              name="classForPass"
              value={formData.classForPass}
              onValueChange={(value) =>
                handleSelectChange("classForPass", value)
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Class for Railway Pass" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">First</SelectItem>
                <SelectItem value="second">Second</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="passPeriod">Railway Pass Period</Label>
            <Select
              id="passPeriod"
              name="passPeriod"
              value={formData.passPeriod}
              onValueChange={(value) => handleSelectChange("passPeriod", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Railway Pass Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="railwayType">Railway Type</Label>
            <Select
              id="railwayType"
              name="railwayType"
              value={formData.railwayType}
              onValueChange={(value) =>
                handleSelectChange("railwayType", value)
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Railway Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="central">Central</SelectItem>
                <SelectItem value="western">Western</SelectItem>
                <SelectItem value="harbor">Harbor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="station">Railway Station Travelling from</Label>
            <Input
              id="station"
              name="station"
              value={formData.station}
              onChange={handleChange}
              placeholder="Station"
              className="border p-2 w-full"
              required
            />
            <p className="text-sm text-gray-300">
              {" "}
              Note:Applicable only till Vile Parle Station
            </p>
          </div>
          <div>
            <Label htmlFor="collectiondate">Collection Date</Label>
            <Input
              id="collectiondate"
              name="collectiondate"
              value={formData.collectiondate}
              onChange={handleChange}
              placeholder="Collection Date"
              className="border p-2 flex justify-around min-w-full textbox-n"
              type="date"
              required
            />
            {errors.collectiondate && (
              <p className="text-red-500 text-sm my-3">
                {errors.collectiondate}
              </p>
            )}
          </div>
          {formData.collectiondate && !errors.collectiondate && (
            <div>
              <Label htmlFor="timeslot">Timeslot</Label>
              <Select
                id="timeslot"
                name="timeslot"
                onOpenChange={async () =>
                  await fetchSlotAvailability(formData.collectiondate)
                }
                value={formData.timeslot}
                onValueChange={(value) => handleSelectChange("timeslot", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Timeslot" />
                </SelectTrigger>
                <SelectContent>
                  {timeslots.map((slot) => (
                    <SelectItem
                      key={slot.value}
                      value={slot.value}
                      disabled={slot.disabled}
                    >
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </main>
      <Footer />
    </>
  );
}
