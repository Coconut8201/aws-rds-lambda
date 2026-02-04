const { Client } = require("pg");

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
};

exports.handler = async (event) => {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    const result = await client.query("SELECT * FROM users ORDER BY id");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        data: result.rows,
      }),
    };
  } catch (error) {
    console.error("錯誤:", error.message);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  } finally {
    await client.end();
  }
};
