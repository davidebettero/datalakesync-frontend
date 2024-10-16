const express = require("express");
const path = require("path");
const os = require("os");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const knex = require("knex");

const app = express();
app.use(express.json());
const port = 3000;

// Funzione per ottenere l'indirizzo IP locale della macchina
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (let devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
  return "127.0.0.1";
}

const db = new sqlite3.Database(
  "./datalake.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Errore durante la connessione al database:", err);
    } else {
      console.log("Connesso al database SQLite");
    }
  }
);

// Configurazione di multer per il caricamento dei file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Serve i file statici dalla cartella 'public'
app.use(express.static("public"));

// Caricamento del file
app.post("/upload", upload.single("file"), (req, res) => {
  //console.log(req.file);

  // Leggo il contenuto del file
  fs.readFile(req.file.path, "utf8", (err, data) => {
    if (err) {
      console.error("Errore nella lettura del file:", err);
      return res.status(500).send("Errore nella lettura del file.");
    }

    data = JSON.parse(data);

    const insertQuery = `INSERT INTO environment 
      (ti, cn, dt, ci, cs, iu, pu, oa, ot, revocation, ev, v, saak, sask) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    // Inserisco il contenuto del file nel database
    db.run(
      insertQuery,
      [
        data.ti || "",
        data.cn || "",
        data.dt || "",
        data.ci || "",
        data.cs || "",
        data.iu || "",
        data.pu || "",
        data.oa || "",
        data.ot || "",
        data.or || "",
        data.ev || "",
        data.v || "",
        data.saak || "",
        data.sask || "",
      ],
      function (err) {
        if (err) {
          console.error("Errore nell'inserimento nel database:", err);
          return res.status(500).send("Errore nell'inserimento nel database.");
        }

        // console.log("Record inserted successfully with ID:", this.lastID);
        res.send("Nuovo ambiente caricato correttamente");
      }
    );
  });
});

// Nuova route per eseguire una query al database SQLite e mostrare i log
app.get("/seeLogs", (req, res) => {
  // Prima query per ottenere i log
  db.all(
    "SELECT * FROM dataLakeEnvironmentLogs ORDER BY timeUsedMs DESC",
    [],
    (err, logs) => {
      if (err) {
        console.error("Errore durante l'esecuzione della query dei log:", err);
        res.status(500).send("Errore nel server");
        return;
      }

      // Mappao ogni log e aggiungo il campo 'ti' recuperato da 'environment'
      const promises = logs.map((log) => {
        return new Promise((resolve, reject) => {
          // Query per ottenere il 'ti' dell'environment
          db.get(
            "SELECT ti FROM environment WHERE id = ?",
            [log.dataLakeEnvironmentID],
            (err, envRow) => {
              if (err) {
                console.error(
                  "Errore durante la query per environment ti:",
                  err
                );
                return reject(err);
              }

              // Aggiungo il valore 'ti' al log
              log.environmentTI = envRow ? envRow.ti : "N/A";
              resolve(log);
            }
          );
        });
      });

      // Attendo che tutte le query siano completate
      Promise.all(promises)
        .then((results) => {
          res.json(results);
        })
        .catch((error) => {
          res.status(500).send("Errore durante il recupero dei dati");
        });
    }
  );
});

// Nuova route per eseguire una query al database SQLite e mostrare il dataLakeEnvironment
app.get("/seeDataLakeEnvironment", (req, res) => {
  const query = `SELECT * FROM dataLakeEnvironment`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Errore durante l'esecuzione della query:", err);
      res.status(500).send("Errore nel server");
      return;
    }

    // Array per memorizzare i riaultati delle query
    const promises = rows.map((row) => {
      return new Promise((resolve, reject) => {
        // Prima query per ottenere l'objectName
        const queryObjectName = `SELECT objectName FROM dataLakeObjects WHERE id = ?`;
        db.get(queryObjectName, [row.dataLakeObjectID], (err, objectRow) => {
          if (err) {
            console.error("Errore durante la query per objectName:", err);
            return reject(err);
          }

          // Seconda query per ottenere il 'ti' dell'environment
          const queryEnvironmentName = `SELECT ti FROM environment WHERE id = ?`;
          db.get(queryEnvironmentName, [row.environmentID], (err, envRow) => {
            if (err) {
              console.error("Errore durante la query per environment ti:", err);
              return reject(err);
            }

            // Aggiungo i valori ottenuti all'oggetto 'row'
            row.objectName = objectRow ? objectRow.objectName : "N/A";
            row.environmentName = envRow ? envRow.ti : "N/A";
            resolve(row);
          });
        });
      });
    });

    // Attendo che tutte le query siano completate
    Promise.all(promises)
      .then((results) => {
        res.json(results); // Invia i dati al client
      })
      .catch((error) => {
        res.status(500).send("Errore durante il recupero dei dati");
      });
  });
});

// Nuova route per eseguire una query al database SQLite e mostrare i dataLakeObjects
app.get("/seeDataLakeObjects", (req, res) => {
  db.all("SELECT * FROM dataLakeObjects", [], (err, rows) => {
    if (err) {
      console.error("Errore durante l'esecuzione della query:", err);
      res.status(500).send("Errore nel server");
      return;
    }

    // Risultati della query in formato JSON
    res.json(rows);
  });
});

// Nuova route per eseguire una query al database SQLite e mostrare i database target
app.get("/seeTargetDatabase", (req, res) => {
  db.all("SELECT * FROM targetDatabase", [], (err, rows) => {
    if (err) {
      console.error("Errore durante l'esecuzione della query:", err);
      res.status(500).send("Errore nel server");
      return;
    }

    // Risultati della query in formato JSON
    res.json(rows);
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/logs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "logs.html"));
});

// Nuova route per testare la connessione con i database target
app.post("/testConnection", async (req, res) => {
  // console.log(req);
  const { server, username, password, database, port } = req.body;

  const db = knex({
    client: "mssql",
    connection: {
      host: server,
      user: username,
      password: password,
      database: database,
      port: port || 1433,
    },
  });

  try {
    await db.raw("SELECT 1");
    db.destroy(); // Chiude la connessione dopo il test
    res.json({ success: true, message: "Connection successful!" });
  } catch (error) {
    db.destroy(); // Chiude la connessione in caso d'errore
    res.json({
      success: false,
      message: `Connection failed: ${error.message}`,
    });
  }
});

app.get("/getColumns", async (req, res) => {
  const { objectName, server, database, username, password } = req.query;

  const db = knex({
    client: "mssql",
    connection: {
      host: server,
      user: username,
      password: password,
      database: database,
    },
  });

  try {
    // Tentativo di connessione al database e di esecuzione della query
    const result = await db.raw(
      `
      SELECT name FROM sys.columns 
      WHERE object_id = OBJECT_ID(?)
    `,
      [objectName]
    );

    // Risultati in formato JSON
    res.json(result);
  } catch (error) {
    console.error(
      "Errore durante l'esecuzione della query o la connessione al DB:",
      error
    );

    // Se l'errore è relativo alla connessione, risponde con un messaggio specifico
    if (
      error.code === "ECONNREFUSED" ||
      error.message.includes("unable to connect")
    ) {
      res.status(500).json({
        message:
          "Errore nella connessione al database. Verifica i dettagli di accesso e prova di nuovo.",
      });
    } else {
      // Altri errori (query, sintassi, ecc.)
      res
        .status(500)
        .json({ message: "Errore durante il recupero delle colonne." });
    }
  } finally {
    db.destroy(); // Chiude la connessione al DB, indipendentemente dal risultato
  }
});

app.post("/addDataLakeObject", (req, res) => {
  const { objectName, objectType, selectedColumns, database } = req.body;

  if (
    !objectName ||
    !objectType ||
    !selectedColumns ||
    selectedColumns.length === 0
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Tutti i campi sono obbligatori." });
  }

  const columnsString = selectedColumns.join(","); // Unisce le colonne in una stringa

  // Inizia la transazione
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Primo inserimento nella tabella dataLakeObjects
    const insertObjectQuery = `INSERT INTO dataLakeObjects (objectName, columnPrefix, uniqueKey, excludedColumn, columns) VALUES (?, ?, ?, ?, ?)`;

    db.run(
      insertObjectQuery,
      [objectName, objectType, "", "", columnsString],
      function (err) {
        if (err) {
          console.error(
            "Errore durante l'inserimento nella tabella dataLakeObjects:",
            err
          );
          db.run("ROLLBACK"); // Annulla la transazione
          return res
            .status(500)
            .json({ success: false, message: "Errore nel server." });
        }

        const dataLakeObjectID = this.lastID; // ID del record inserito nella tabella dataLakeObjects

        // Recupera l'environment ID dalla tabella environment in base al valore 'ti' del database selezionato
        const selectEnvironmentQuery = `SELECT id FROM environment WHERE ti = ?`;
        db.get(selectEnvironmentQuery, [database], (err, row) => {
          if (err) {
            console.error(
              "Errore durante il recupero dell'environment ID:",
              err
            );
            db.run("ROLLBACK"); // Annulla la transazione
            return res
              .status(500)
              .json({ success: false, message: "Errore nel server." });
          }

          if (!row) {
            db.run("ROLLBACK"); // Annulla la transazione
            return res.status(404).json({
              success: false,
              message: "Environment non trovato per il database selezionato.",
            });
          }

          const environmentID = row.id;

          // Secondo inserimento nella tabella dataLakeEnvironment
          const insertEnvironmentQuery = `INSERT INTO dataLakeEnvironment (dataLakeObjectID, environmentID, schedulation, activeYN) VALUES (?, ?, ?, ?)`;

          db.run(
            insertEnvironmentQuery,
            [dataLakeObjectID, environmentID, "* * * * *", 1],
            function (err) {
              if (err) {
                console.error(
                  "Errore durante l'inserimento nella tabella dataLakeEnvironment:",
                  err
                );
                db.run("ROLLBACK"); // Annulla la transazione
                return res.status(500).json({
                  success: false,
                  message:
                    "Errore nel server durante l'inserimento dell'environment.",
                });
              }

              // Se entrambe le operazioni sono andate a buon fine, conferma la transazione
              db.run("COMMIT", (err) => {
                if (err) {
                  console.error(
                    "Errore durante il commit della transazione:",
                    err
                  );
                  return res.status(500).json({
                    success: false,
                    message: "Errore nel server durante il commit.",
                  });
                }

                // Invia la risposta di successo al client
                res.json({
                  success: true,
                  message:
                    "DataLake Object e Environment aggiunti con successo!",
                  id: dataLakeObjectID,
                });
              });
            }
          );
        });
      }
    );
  });
});

// Route per eliminare un record da dataLakeObjects e conseguentemente da dataLakeEnvironment
app.post("/eliminaDataLakeObject", (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID non fornito" });
  }

  // Inizia la transazione per eliminare il record da entrambe le tabelle
  db.serialize(() => {
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        console.error("Errore durante l'inizio della transazione:", err);
        return res.status(500).json({
          success: false,
          message: "Errore nell'inizio della transazione.",
        });
      }

      // Elimina dalla tabella dataLakeObjects
      const eliminaDaDataLakeObjects = `DELETE FROM dataLakeObjects WHERE id = ?`;
      db.run(eliminaDaDataLakeObjects, [id], function (err) {
        if (err) {
          console.error(
            "Errore durante l'eliminazione da dataLakeObjects:",
            err
          );
          db.run("ROLLBACK", (rollbackErr) => {
            if (rollbackErr) {
              console.error("Errore durante il rollback:", rollbackErr);
            }
          });
          return res.status(500).json({
            success: false,
            message:
              "Errore nel server durante l'eliminazione da dataLakeObjects.",
          });
        }

        // Elimina dalla tabella dataLakeEnvironment
        const eliminaDaDataLakeEnvironment = `DELETE FROM dataLakeEnvironment WHERE dataLakeObjectID = ?`;
        db.run(eliminaDaDataLakeEnvironment, [id], function (err) {
          if (err) {
            console.error(
              "Errore durante l'eliminazione da dataLakeEnvironment:",
              err
            );
            db.run("ROLLBACK", (rollbackErr) => {
              if (rollbackErr) {
                console.error("Errore durante il rollback:", rollbackErr);
              }
            });
            return res.status(500).json({
              success: false,
              message:
                "Errore nel server durante l'eliminazione da dataLakeEnvironment.",
            });
          }

          // Se entrambe le operazioni sono andate a buon fine, esegue il COMMIT
          db.run("COMMIT", (commitErr) => {
            if (commitErr) {
              console.error(
                "Errore durante il commit della transazione:",
                commitErr
              );
              db.run("ROLLBACK", (rollbackErr) => {
                if (rollbackErr) {
                  console.error("Errore durante il rollback:", rollbackErr);
                }
              });
              return res.status(500).json({
                success: false,
                message: "Errore nel server durante il commit.",
              });
            }

            res.json({
              success: true,
              message: "Record eliminato con successo",
            });
          });
        });
      });
    });
  });
});

// Route per aggiornare Active YN e Record Schedulation nel database nella tabella dataLakeEnvironment
app.post("/updateDataLakeEnvironment", (req, res) => {
  const modifiche = req.body;

  // Inizio della transazione per garantire che tutte le modifiche siano applicate insieme
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    modifiche.forEach((modifica) => {
      const { id, activeYN, recordSchedulation } = modifica;

      // Aggiorna Active YN e Record Schedulation per ogni riga modificata
      db.run(
        `UPDATE dataLakeEnvironment SET activeYN = ?, recordSchedulation = ? WHERE id = ?`,
        [activeYN, recordSchedulation || null, id], // recordSchedulation può essere null se vuoto
        (err) => {
          if (err) {
            console.error("Errore durante l'aggiornamento del database:", err);
            db.run("ROLLBACK");
            return res.status(500).json({ success: false });
          }
        }
      );
    });

    // Commit della transazione
    db.run("COMMIT", (err) => {
      if (err) {
        console.error("Errore durante il commit della transazione:", err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    });
  });
});

// Avvia il server
app.listen(port, () => {
  const ipAddress = getIPAddress();
  console.log(
    `Server in esecuzione su http://localhost:${port} e http://${ipAddress}:${port}`
  );
});
