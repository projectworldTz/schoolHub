# SchoolHub

## School Management Information System

**SchoolHub** is a comprehensive School Management Information System designed to digitize and simplify academic, administrative, financial, and communication processes within schools.

The system was **analyzed and developed** to address real school operational requirements, including student management, attendance, examinations, fees, staff management, reporting, communication, and other day-to-day school activities.

---

## System Analysis & Design

SchoolHub was developed by analyzing school users, business processes, system requirements, data relationships, and operational workflows.

The system design is documented using UML and other system modelling techniques.

### Use Case Diagram

Shows the major system actors and how they interact with SchoolHub.

![SchoolHub Use Case Diagram](docs/diagram/use-case-diagram.png)

### Entity Relationship Diagram (ERD)

Shows the major database entities and relationships used by SchoolHub.

![SchoolHub ERD](docs/diagram/erd.png)

### Activity Diagram

Shows the workflow of the student enrollment process, including validation, class assignment, system processing, and confirmation.

![SchoolHub Activity Diagram](docs/diagram/activity-diagram.png)

### System Architecture

Shows the high-level architecture and interaction between the React frontend, Laravel REST API, MySQL database, users, hosting infrastructure, and external services.

![SchoolHub System Architecture](docs/diagram/system-architecture.png)

### UML Class Diagram

Shows the major system classes, attributes, operations, and relationships.

![SchoolHub Class Diagram](docs/diagram/class-diagram.png)

---

## Key Modules

* Student Management
* Teacher & Staff Management
* Parent Management
* Academic Management
* Attendance Management
* Examinations & Results
* Report Cards
* Fees & Finance
* Timetable Management
* Communication & Notifications
* Inventory Management
* Payroll
* Library Management
* Reports & Analytics
* Calendar
* AI Assistant
* Public School Website

---

## User Roles

SchoolHub supports role-based access for different users, including:

* Platform Super Admin
* School Administrator
* Teachers
* Students
* Parents/Guardians
* Accountants
* Other authorized school staff

Permissions and available features depend on the user's assigned role.

---

## Technology Stack

### Backend

* PHP
* Laravel
* REST API
* MySQL
* Laravel Sanctum

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Other Technologies

* JSON / REST APIs
* Git & GitHub
* SMS Integration
* AI/LLM API Integration
* Role-Based Access Control

---

## System Architecture

The application follows a frontend/backend architecture:

```text
Users
   │
   ▼
React + TypeScript Frontend
   │
   │ HTTPS / REST API
   ▼
Laravel Backend API
   │
   ├── Authentication & Authorization
   ├── Business Logic
   ├── Validation
   ├── Reporting
   └── External Service Integration
   │
   ▼
MySQL Database
```

External services can be integrated for functions such as SMS notifications and AI-assisted features.

---

## Main Objectives

SchoolHub aims to:

* Reduce manual school administration.
* Centralize school information.
* Improve accuracy of academic and financial records.
* Simplify communication between schools, teachers, students, and parents.
* Improve reporting and management decision-making.
* Provide secure role-based access to school information.
* Support schools in their digital transformation.

---

## Development Role

**Systems Analysis & Software Development**

Responsibilities included:

* Business process analysis
* Requirements gathering and analysis
* Database and data relationship design
* System workflow design
* Backend development
* Frontend development
* REST API development and integration
* System testing and debugging
* User support
* Deployment and continuous system improvement

---

## Developer

**Kelvin Leonard Mikida**

Bachelor of Science in Business Information Technology
University of Dar es Salaam

GitHub: `projectworldTz`
Portfolio: `projectworldtz.com`

---

## Project Status

SchoolHub is under continuous development and improvement as additional school requirements, integrations, reporting capabilities, and system features are implemented.

---

© ProjectWorld Tanzania
