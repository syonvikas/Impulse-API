var async = require("async");
module.exports = function(Program) {
  /*********************** VALIDATIONS STARTS*******************/

  //Program.validatesUniquenessOf('name', { message: 'Name is already in use.' });

  /*********************** VALIDATIONS ENDS*******************/
  Program.saveProgram = function(data, cb) {
    var ProgramScheduleModel = Program.app.models.ProgramSchedule;
    var ExerciseModel = Program.app.models.Exercise;
    var DietProgramModel = Program.app.models.DietProgram;
    var schedulesArr = [], exerciseArr = [], dietProgramArr = [];
    if (data && data.schedules && data.schedules.length) {
      schedulesArr = data.schedules; // store schedule in arr
      try {
        delete data.schedules // delete from data obj
      }
      catch (e) {
        // no need to handle
      }
    }
    async.waterfall([
        function(callback) {
          Program.create(data, function (err, savedProgramObj) {
            if (err)
              return callback(err, null);
            return callback(null, savedProgramObj);
          });
        },
        function(savedProgramObj, callback) {
          if (schedulesArr && schedulesArr.length && savedProgramObj && savedProgramObj.id) {
            schedulesArr.forEach(function(sch, key) {
              sch.programId = savedProgramObj.id;
              //store diet program
              if (sch.dietProgramId && sch.dietProgramId.length) {
                dietProgramArr = dietProgramArr.concat(sch.dietProgramId.filter(function(v){return v && v.name;}));
              }
              // store exercises
              if (sch.exerciseId && sch.exerciseId.length) {
                exerciseArr = exerciseArr.concat(sch.exerciseId.filter(function(v){return v && v.name;}));
              }
            });
            async.parallel([
                function(cbk) {
                  if (exerciseArr && exerciseArr.length) {
                    ExerciseModel.create(exerciseArr, function (err, exercises) {
                      if (err)
                        return cbk(err, null);
                      //replace the exercise objects in schedules with ids
                      var index = 0;
                      schedulesArr.forEach(function(sch, key) {
                        if (sch.exerciseId && sch.exerciseId.length) {
                          sch.exerciseId.forEach(function(exercise, key2){
                            if (exercise && exercise.name) {
                              schedulesArr[key].exerciseId[key2]  = exercises[index].id;
                              index++;
                            }
                          });
                        }
                      });
                      return cbk(null, null);
                    });
                  }
                  else
                    return cbk(null, null);
                },
                function(cbk) {
                  if (dietProgramArr && dietProgramArr.length) {
                    DietProgramModel.create(dietProgramArr, function (err, diets) {
                      if (err)
                        return cbk(err, null);
                      //replace the exercise objects in schedules with ids
                      var index = 0;
                      schedulesArr.forEach(function(sch, key) {
                        if (sch.dietProgramId && sch.dietProgramId.length) {
                          sch.dietProgramId.forEach(function(diet, key2){
                            if (diet && diet.name) {
                              schedulesArr[key].dietProgramId[key2]  = diets[index].id;
                              index++;
                            }
                          });
                        }
                      });
                      return cbk(null, null);
                    });
                  }
                  else
                    return cbk(null, null);
                },
              ],function(err,docs1){
                if (err)
                  return callback(err, null);
                ProgramScheduleModel.create(schedulesArr, function (err, docs) {
                  if (err)
                    return callback(err, null);
                  return callback(null, savedProgramObj);
                });
              });
          }
          else
          return callback(null, savedProgramObj);
        }
      ],
      function(err, data) {
        if (err) {
          return cb(err);
        }
        if(data && data.id) {
          cb(null, data);

        }else {
          var err = new Error('Could not create program');
          err.status = err.statusCode = 422;
          err.code = 'CANT_CREATE_PROGRAM';
          return cb(err);
        }
      });
  };

  Program.updateProgram = function(data, cb) {
    var ProgramScheduleModel = Program.app.models.ProgramSchedule;
    var ExerciseModel = Program.app.models.Exercise;
    var DietProgramModel = Program.app.models.DietProgram;
    var schedulesArr = [], exerciseArr = [], dietProgramArr = [];
    var customErr = new Error('Could not update program');
    customErr.status = customErr.statusCode = 422;
    customErr.code = 'CANT_UPDATE_PROGRAM';
    if (!data.id) {
      return cb(customErr);
    }
    if (data && data.schedules && data.schedules.length) {
      schedulesArr = data.schedules; // store schedule in arr
      try {
        delete data.schedules // delete from data obj
      }
      catch (e) {
        // no need to handle
      }
    }
    async.waterfall([
        function(callback) {
          Program.findOne({where:{id: data.id}}, function (err, ProgramObj) {
            if (err || !ProgramObj)
              return callback(err || customErr, null);
            //updateAttributes
            ProgramObj.updateAttributes(data, function (err, updatedProgramObj) {
              if (err)
                return callback(err, null);
              //updateAttributes
              return callback(null, updatedProgramObj);
            })
          });
        },
        // delete old schedules
        function(updatedProgramObj, callback) {
          ProgramScheduleModel.deleteAll({programId:updatedProgramObj.id}, function (err, deletedSchedules) {
            if (err)
              return callback(err, null);
            return callback(null, updatedProgramObj);
          });
        },
        function(updatedProgramObj, callback) {
          if (schedulesArr && schedulesArr.length && updatedProgramObj && updatedProgramObj.id) {
            schedulesArr.forEach(function(sch, key) {
              sch.programId = updatedProgramObj.id;
              //store diet program
              if (sch.dietProgramId && sch.dietProgramId.length) {
                dietProgramArr = dietProgramArr.concat(sch.dietProgramId.filter(function(v){return v && v.name;}));
              }
              // store exercises
              if (sch.exerciseId && sch.exerciseId.length) {
                exerciseArr = exerciseArr.concat(sch.exerciseId.filter(function(v){return v && v.name;}));
              }
            });
            async.parallel([
              function(cbk) {
                if (exerciseArr && exerciseArr.length) {
                  ExerciseModel.create(exerciseArr, function (err, exercises) {
                    if (err)
                      return cbk(err, null);
                    //replace the exercise objects in schedules with ids
                    var index = 0;
                    schedulesArr.forEach(function(sch, key) {
                      if (sch.exerciseId && sch.exerciseId.length) {
                        sch.exerciseId.forEach(function(exercise, key2){
                          if (exercise && exercise.name) {
                            schedulesArr[key].exerciseId[key2]  = exercises[index].id;
                            index++;
                          }
                        });
                      }
                    });
                    return cbk(null, null);
                  });
                }
                else
                  return cbk(null, null);
              },
              function(cbk) {
                if (dietProgramArr && dietProgramArr.length) {
                  DietProgramModel.create(dietProgramArr, function (err, diets) {
                    if (err)
                      return cbk(err, null);
                    //replace the exercise objects in schedules with ids
                    var index = 0;
                    schedulesArr.forEach(function(sch, key) {
                      if (sch.dietProgramId && sch.dietProgramId.length) {
                        sch.dietProgramId.forEach(function(diet, key2){
                          if (diet && diet.name) {
                            schedulesArr[key].dietProgramId[key2]  = diets[index].id;
                            index++;
                          }
                        });
                      }
                    });
                    return cbk(null, null);
                  });
                }
                else
                  return cbk(null, null);
              },
            ],function(err,docs1){
              if (err)
                return callback(err, null);
              ProgramScheduleModel.create(schedulesArr, function (err, docs) {
                if (err)
                  return callback(err, null);
                return callback(null, updatedProgramObj);
              });
            });
          }
          else
            return callback(null, updatedProgramObj);
        }
      ],
      function(err, data) {
        if (err) {
          return cb(err);
        }
        if(data && data.id) {
          cb(null, data);

        }else {
          return cb(customErr);
        }
      });

  };

  //Create a remote method to add program with schedules and exercises
  Program.remoteMethod('saveProgram', {
    http: {path: '/saveProgram', verb: 'post'},
    accepts: [
      {arg: 'data', type: 'object', http: {source: 'body'}, required: true, description:'An object of model property name/value pairs' }
    ],
    returns: {root: true, type: 'object'},
    description: 'Add Program with schedules and exercises'
  });
  //Update a remote method to add program with schedules and exercises
  Program.remoteMethod('updateProgram', {
    http: {path: '/updateProgram', verb: 'post'},
    accepts: [
      {arg: 'data', type: 'object', http: {source: 'body'}, required: true, description:'An object of model property name/value pairs id is required'}
    ],
    returns: {root: true, type: 'object'},
    description: 'Update Program with schedules and exercises'
  });
};
