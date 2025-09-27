const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let employees = [];

function showMenu() {
  console.log("\n=== Employee Management System ===");
  console.log("1. Add Employee");
  console.log("2. List Employees");
  console.log("3. Remove Employee");
  console.log("4. Exit");
  rl.question("Choose an option: ", handleMenu);
}

function handleMenu(choice) {
  switch (choice.trim()) {
    case "1":
      addEmployee();
      break;
    case "2":
      listEmployees();
      break;
    case "3":
      removeEmployee();
      break;
    case "4":
      console.log("Exiting... Goodbye!");
      rl.close();
      break;
    default:
      console.log("❌ Invalid option. Try again.");
      showMenu();
  }
}

function addEmployee() {
  rl.question("Enter Employee ID: ", (id) => {
    rl.question("Enter Employee Name: ", (name) => {
      if (employees.some(emp => emp.id === id)) {
        console.log("⚠️ Employee with this ID already exists!");
      } else {
        employees.push({ id, name });
        console.log(`✅ Employee Added: [${id}] ${name}`);
      }
      showMenu();
    });
  });
}

function listEmployees() {
  console.log("\n📋 Employee List:");
  if (employees.length === 0) {
    console.log("No employees found.");
  } else {
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ID: ${emp.id}, Name: ${emp.name}`);
    });
  }
  showMenu();
}

function removeEmployee() {
  rl.question("Enter Employee ID to remove: ", (id) => {
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      const removed = employees.splice(index, 1);
      console.log(`🗑️ Removed Employee: [${removed[0].id}] ${removed[0].name}`);
    } else {
      console.log("❌ No employee found with that ID.");
    }
    showMenu();
  });
}

showMenu();
