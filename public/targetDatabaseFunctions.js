// Funzione per popolare la tabella con i dati del database
function popolaTabella() {
  fetch("/seeTargetDatabase")
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.querySelector("#tabella-dati tbody");

      // Cancella i dati della tabella precedente
      tbody.innerHTML = "";

      // Popola la tabella con i dati ricevuti
      data.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.id === null ? "" : row.id}</td>
          <td>${row.server === null ? "" : row.server}</td>
          <td>${row.username === null ? "" : row.username}</td>
          <td>${row.password === null ? "" : row.password}</td>
          <td>${row.targetDatabase === null ? "" : row.targetDatabase}</td>
          <td>${row.targetSchema === null ? "" : row.targetSchema}</td>
          <td><button class="azione-btn" data-index="${index}">Test</button></td>
        `;
        tbody.appendChild(tr);
      });

      document.querySelectorAll(".azione-btn").forEach((button) => {
        button.addEventListener("click", async function () {
          const index = this.getAttribute("data-index");
          const selectedDatabase = data[index];
          const originalText = this.textContent;

          const buttons = document.querySelectorAll(".azione-btn");
          buttons.forEach((btn) => {
            btn.disabled = true;
          });

          this.textContent = "Testing...";

          try {
            console.log(selectedDatabase);
            const response = await fetch("/testConnection", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                server: selectedDatabase.server,
                username: selectedDatabase.username,
                password: selectedDatabase.password,
                database: selectedDatabase.targetDatabase,
                port: selectedDatabase.port || 1433,
              }),
            });

            const result = await response.json();
            if (result.success) {
              console.log("Connection successful!");
              alert("Connection successful!");
            } else {
              console.error("Connection failed:", result.message);
              alert(`Connection failed: ${result.message}`);
            }
          } catch (error) {
            console.error("Error during the connection test:", error);
            alert("Error during the connection test.");
          } finally {
            buttons.forEach((btn) => {
              btn.disabled = false;
              btn.textContent = "Test";
            });

            this.textContent = originalText;
          }
        });
      });
    })
    .catch((error) => {
      console.error("Error loading data:", error);
    });
}

// Chiama la funzione per popolare la tabella al caricamento della pagina
window.onload = popolaTabella;

// Funzione di reindirizzamento alla pagina principale
function tornaAllaPaginaPrincipale() {
  window.location.href = "index.html";
}
