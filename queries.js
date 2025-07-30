const Pool = require("pg").Pool;
const pool = new Pool({
  user: "ublctmmglou7hi",
  host: "cepejvghn9noue.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com",
  database: "ddtcrljun8vv5d",
  password: "p31c8ddbd29c68038ec7f6280d007c005f469b1479e02b9d07e77054a2db7bcab",
  port: 5432,
});

const getUsers = (request, response) => {
  var responseReturn = new ResponseClass();
  pool.query("SELECT * FROM users ORDER BY id ASC", (error, results) => {
    if (error) {
      throw error;
    }

    responseReturn.status = true;
    responseReturn.code = 200;
    responseReturn.message = "Success";
    responseReturn.data = results.rows;
    // console.log(responseReturn.data);

    response.status(200).json(responseReturn);
  });
};
