(function() {
  var name, variables;

  variables = {
    ERP_CLIENT: "sorter",
    ERP_LOGIN: "sorter",
    ERP_PASSWORD: "sorter"
  };

  for (name in variables) {
    if (process.env[name] != null) {
      variables[name] = process.env[name];
    }
  }

  module.exports = variables;

}).call(this);
