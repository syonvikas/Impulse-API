module.exports = function(app) {

  //Function for checking the file type..
  app.dataSources.storage.connector.getFilename = function(file, req, res) {
  	var name = "FILE"+new Date().getTime();
     //Return the new FileName
     return name+'.jpg';
 }

}