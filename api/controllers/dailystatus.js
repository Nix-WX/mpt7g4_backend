const errorHandler = require('../util/errorHandler');

const DailyStatus = require('../models/dailystatus');
const User = require('../models/user');


exports.dailyStatus_getToday = (req, res, next) => {
    User.find({ status: "Diagnosed" })
    .then(activeDiagnosedUsers => {
        DailyStatus.findOne({ date: new Date().toLocaleDateString() })
        .then(result => {
            if(!result) {
                const dailyStatus = new DailyStatus();
    
                dailyStatus.save()
                .then(savedResult => {

                    DailyStatus.find()
                    .then(allStatuses => {
                        let cumulatedDiagnosed = 0;

                        allStatuses.map(singleStatus => {
                            cumulatedDiagnosed += singleStatus.diagnosed;
                        });

                        return res.status(200).json({
                            message: 'Daily Status returned successfully',
                            data: { 
                                recovered: savedResult.recovered,
                                diagnosed: savedResult.diagnosed,
                                activeDiagnosed: activeDiagnosedUsers.length,
                                cumulatedDiagnosed: cumulatedDiagnosed,
                                date: result.date.toString()
                            }
                        });
                    })
                    .catch(err => errorHandler(res, err));

                })
                .catch(err => errorHandler(res, err));
            }
            else {

                DailyStatus.find()
                .then(allStatuses => {
                    let cumulatedDiagnosed = 0;

                    allStatuses.map(singleStatus => {
                        cumulatedDiagnosed += singleStatus.diagnosed;
                    });

                    return res.status(200).json({
                        message: 'Daily Status returned successfully',
                        data: { 
                            recovered: result.recovered,
                            diagnosed: result.diagnosed,
                            activeDiagnosed: activeDiagnosedUsers.length,
                            cumulatedDiagnosed: cumulatedDiagnosed,
                            date: result.date.toString()
                        }
                    });
                })
                .catch(err => errorHandler(res, err));

            }
        })
        .catch(err => errorHandler(res, err));
    })
    .catch(err => errorHandler(res, err));
};