# 🏥 Hospital Issue Tracking System

A **web-based application** to streamline issue reporting and resolution in a hospital environment.  
Built using **React**, **Node.js**, **Express.js**, **MySQL**, and **Cron Jobs**, this system improves operational efficiency, accountability, and problem-solving in hospitals by providing a centralized platform for employees, managers, and admins.

---

## 🚀 Overview

Hospitals often face inefficiencies in manually reporting and tracking issues, leading to delays, miscommunication, and lack of accountability.  
This system solves these problems by allowing:

✅ Employees to report issues through an intuitive web interface.  
✅ Department managers to track, prioritize, and resolve issues in real-time.  
✅ Admins to monitor hospital operations with automated, timestamped reports.  
✅ Notifications and periodic reports scheduled via **Cron Jobs**.

The platform improves efficiency, transparency, and scalability for hospital operations.

---

## 💡 Problem and Solution

### Problem
Manual issue tracking in hospitals results in:
- Delayed resolution.
- Miscommunication between staff and managers.
- Lack of visibility into recurring issues.

### Solution
The **Hospital Issue Tracking System** provides:
- A centralized, role-based platform.
- Real-time routing of issues to the appropriate department.
- Dashboards for managers and admins.
- Automated reporting and reminders.

---

## 🛠️ Tech Stack

| Technology       | Why? |
|-------------------|------|
| **React**         | Dynamic, responsive, and reusable UI components. |
| **Node.js & Express.js** | Scalable, fast backend API development with clear routing and async operations. |
| **MySQL**         | Relational database ideal for structured hospital data. |
| **Cron Jobs**     | Automates recurring tasks like generating reports and sending reminders. |

---

## 🏗️ System Architecture

- **Frontend (React)**:  
  Allows employees to submit issues, view status, and track their requests.  
  Department managers use a dashboard to resolve and prioritize issues.  
  Admins view system-wide reports.

- **Backend (Node.js & Express.js)**:  
  RESTful APIs handle requests, process business logic, and communicate with MySQL.  
  Middleware ensures authentication, role-based access, and data validation.

- **Database (MySQL)**:  
  Stores data in normalized tables:
  - Employees
  - Issues
  - Departments
  - Admins

- **Automation (Cron Jobs)**:  
  Automates scheduled tasks like:
  - Generating daily/weekly PDF reports.
  - Sending email reminders for unresolved issues.

---

## ✨ Key Features

✅ Employee interface to submit issues with department, description, and urgency.  
✅ Department manager dashboard to track and resolve assigned issues.  
✅ Admin panel with detailed reports and statistics.  
✅ Automated daily/weekly reports sent to admins.  
✅ Real-time notifications for new issues (optional).  
✅ Role-based access control (Employee, Manager, Admin).  
✅ Secure authentication using JWT and HTTPS.  

---

## 📈 Impact and Scalability

- Reduced issue resolution time.
- Improved accountability via timestamped tracking.
- Scalable to support:
  - Multiple hospitals (multi-tenant support).
  - AI-based prioritization of critical issues.
  - Mobile app (future enhancement).

---

## 🧪 Challenges and Solutions

- **Real-time notifications**: Initially used polling but later implemented WebSockets to ensure managers are instantly notified without overloading the server.
- **Concurrency**: Handled simultaneous submissions using async operations and queuing.
- **Security**: Implemented input validation, prepared statements, and HTTPS to protect against common vulnerabilities.

---

## 🔍 Authentication and Authorization

- JWT-based authentication with tokens stored securely.
- Middleware-based role-checks to ensure only authorized users can access specific routes.

---
