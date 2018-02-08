# Job Seeker's Journal API
[Job Seeker's Journal API](job-seeker-journal.herokuapp.com/) is the server side of a full-stack React-Redux project that allows users to maintain a record of jobs they are applying, chart their skills, and keep track of their job application process.

This inspiration came from the fact that I would like a simple and interesting app to monitor my job hunting, and at the same time, try to avoid having to rely on writing on post-its or notebooks, typing up an excel sheet, or using apps that require subscription and provide only limited free trial.

## What does the app do
Try the app on this [site](https://job-seeker-journal.netlify.com/)
The app currently provides users with the following functions:
1. Add and edit skills and corresponding experience in years
2. Graph skills on a radial chart, allowing users to assess their current skill sets and gauge on their potential on landing their target jobs
2. Build collections of jobs being applied
3. Edit the job application process
4. Generate a bar chart, providing users an overview of their job application process. For example, how many jobs the user have applied from January to March, and how many interviews and offers were received during that period.

## Technology
### Front End
[job-seeker-journal-client](https://github.com/julweng/job-seeker-journal-client)

### Back End
* Node.js and Express.js
* MongoDB and Mongoose
* passort, bcrypt, morgan, bodyparser, moment.js

### Testing
* Mocha, Chai, Travis CI, faker
