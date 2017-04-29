var sql = require("mssql");
 
sql.connect("mssql://user_id:password@server_name/db_name").then(function() {
    // Query 
	new sql.Request().query('select * from table_name').then(function(recordset) {
		console.dir(recordset);
	}).catch(function(err) {
		console.error("query error", err);
	});

    // Stored Procedure 
	/*new sql.Request()
	.input('input_parameter', sql.Int, value)
    .output('output_parameter', sql.VarChar(50))
	.execute('procedure_name').then(function(recordsets) {
		console.dir(recordsets);
	}).catch(function(err) {
		// ... execute error checks 
	});*/

}).catch(function(err) {
	console.error("connection error", err);
});
