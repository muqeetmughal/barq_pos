# ⚡ BarqPOS

**BarqPOS** is a fast, modern Point of Sale system built on top of the **Frappe Framework and ERPNext**, designed for high-speed retail environments where checkout speed and simplicity matter.

*Barq* means **lightning** — and that’s the promise:  
**instant billing, smooth checkout, zero friction at the counter.**

---

## 🚀 What is BarqPOS?

Most ERP-based POS systems are slow, cluttered, and painful for cashiers.

BarqPOS focuses on:
- Speed over complexity
- Clean UI over bloated features
- Real retail workflows, not ERP screens

It leverages ERPNext’s power **without exposing users to ERP chaos**.

---

## ✨ Key Features

- ⚡ Lightning-fast billing experience
- 🧾 Clean and intuitive POS interface
- 🏬 Single-store and multi-store support
- 📦 Real-time inventory synchronization
- 💰 Multiple payment modes
- 👤 Customer management
- 🧮 Tax and discount handling
- 🔐 Role-based access control
- 🌐 Online-first with offline support where available

---

## 🧠 Built on ERPNext (Done Right)

BarqPOS is:
- A **native Frappe app**
- Built on **standard ERPNext doctypes**
- Fully **upgrade-safe**
- Easy to **extend and customize**

You get proper accounting, inventory, and reporting — without slowing down the counter.

---

## 🛠 Tech Stack

- Frappe Framework
- ERPNext
- Python
- JavaScript
- React
- MariaDB

---

## 📦 Installation

### Prerequisites

- Frappe Framework (v15+ recommended)
- ERPNext installed on the same site

### Install the App

```bash
bench get-app barq_pos https://github.com/muqeetmughal/barq_pos
bench --site your-site install-app barq_pos
bench migrate
