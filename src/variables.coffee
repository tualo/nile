
variables =
  ERP_CLIENT: "sorter"
  ERP_LOGIN: "sorter"
  ERP_PASSWORD: "sorter"

(variables[name] = process.env[name] for name of variables when process.env[name]? )

module.exports = variables
