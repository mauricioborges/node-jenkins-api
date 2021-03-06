var util     = require('util')
    ,qs      = require('querystring')
    ,request = require('request');

API = '/api/json';
NEWJOB = '%s/createItem/?name=%s';
DELETE = '%s/job/%s/doDelete';
BUILD = '%s/job/%s/build' + API;
DISABLE = '%s/job/%s/disable';
ENABLE = '%s/job/%s/enable';
BUILDWITHPARAMS = '%s/job/%s/buildWithParameters';
CONFIG = '%s/job/%s/config.xml';
JOBINFO = '%s/job/%s' + API;
LIST = '%s' + API;
LAST_SUCCESS = '%s/job/%s/lastSuccessfulBuild' + API;
TEST_REPORT = '%s/job/%s/lastSuccessfulBuild/testReport' + API;
LAST_BUILD = '%s/job/%s/lastBuild' + API;
LAST_COMPLETED_BUILD = '%s/job/%s/lastCompletedBuild' + API;
LAST_REPORT = '%s/job/%s/lastBuild/testReport' + API;
QUEUE = '%s/queue' + API;
COMPUTERS = '%s/computer' + API;
JOB_OUTPUT = '%s/job/%s/consoleText' + API;
VIEWS='%s'+API+'?tree=views[name]';
NESTED_VIEWS = API + '?tree=views[name]';
JOBS_FROM_NESTED_VIEWS = API + '?tree=jobs[name,displayName,modules[name]]';
BUILDS_FROM_JOBS='%s/job/%s' + API+'?tree=builds[url,result]';



var init = exports.init = function(host) {
   
    //Jenkin variables
    var host = host;
    
	
	
    //Helper Functions
    var build_url = function(command) {
        /*
        Builds REST url to Jenkins
        */
        
        // Create the url using the format function
        var url = util.format.call(this, command, host);

        // if command is the only arg, we are done
        if (arguments.length == 1) return url;

        // Grab the arguments except for the first (command)
        var args = Array.prototype.slice.call(arguments).slice(1);

        // Append url to front of args array
        args.unshift(url);

        // Create full url with all the arguments
        url = util.format.apply(this, args);

        return url;


    }
	var view_url = function(l) {
		views_list=l.slice(0)
		appended_view_path="%s"
		while (views_list.length > 0){
			shifted=views_list.shift()
			appended_view_path+="/view/"+shifted
		}
		return appended_view_path
	
	}
	
    return {
        build: function(jobname, params, callback) {
            /*
            Trigger Jenkins to build.
            */
            if (typeof params === 'function') { 
                buildurl = build_url(BUILD, jobname)
                callback = params;
            } else {
                buildurl = build_url(BUILDWITHPARAMS+"?"+qs.stringify(params), jobname)
            }
            
            request({method: 'POST', url: buildurl }, function(error, response, body) {
                if ( error || (response.statusCode !== 201 && response.statusCode !== 302) ) {
                    callback(error || true, response);
                    return;
                }
                data = "job is executed"
                callback(null, data);
            });
        },
        all_jobs: function(callback) {
            /*
            Return a list of object literals containing the name and color of all jobs on the Jenkins server
            */
            request({method: 'GET', url: build_url(LIST)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString()).jobs;
                callback(null, data);
            });
        },
        job_info: function(jobname, callback) {
            /*
            Get all information for a job
            */
            request({method: 'GET', url: build_url(JOBINFO, jobname)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        last_build_info: function(jobname, callback) {
            /*
            Get information for the last build of a job
            */
            request({method: 'GET', url: build_url(LAST_BUILD, jobname)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        last_completed_build_info: function(jobname, callback) {
            /*
            Get information for the last completed build of a job
            */
            request({method: 'GET', url: build_url(LAST_COMPLETED_BUILD, jobname)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        build_info: function(jobname, number, callback) {
            /*
            Get information for the build number of a job
            */
            request({method: 'GET', url: build_url(BUILD, jobname, number)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        last_build_report: function(jobname, callback) {
            /*
            Get the last build report for a job
            */
            request({method: 'GET', url: build_url(LAST_REPORT, jobname)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        get_config_xml: function(jobname, callback) {
            /*
            Get the config xml for a job
            */
            request({method: 'GET', url: build_url(CONFIG, jobname)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = body;
                callback(null, data);
            });
        },
        create_job: function(jobname, job_config, callback) {
            /*
           Create a new job based on a job_config string 
            */

            //console.log(build_url(NEWJOB, jobname));
            request(
                {method: 'POST' 
                ,url: build_url(NEWJOB, jobname)
                ,body: job_config
                ,headers: { "content-type": "application/xml"}
                }, 
                
                function(error, response, body) {
                    if ( error || response.statusCode !== 200 ) {
                        callback(error || true, response);
                        return;
                    }
                    data = body;
                    callback(null, data);
                }
            );
        },
        copy_job: function(jobname, new_job, modifyfunction, callback) {
            /*
            Copies a job and allows you to pass in a function to modify the configuration
            of the job you would like to copy
            */

            var self = this;
            self.get_config_xml(jobname, function(error, data) {
                if (error) {
                    callback(error, data);
                    return;
                }
                self.create_job(new_job, modifyfunction(data), function(error, data) {
                    if (error) {
                        callback(error, data);
                        return;
                    }
                    callback(null, data);
                });
            });

        },
        delete_job: function(jobname, callback) {
            /*
            Deletes a job 
            */
            request({method: 'POST', url: build_url(DELETE, jobname)}, function(error, response, body) {
                if ( error || response.statusCode === 404 ) {
                    callback(error || true, response);
                    return;
                }
                callback(null, body);
            });
            
        },
        disable_job: function(jobname, callback) {
            /*
            Disables a job
            */
            request({method: 'POST', url: build_url(DISABLE, jobname)}, function(error, response, body) {
                if ( error || response.statusCode === 404 ) {
                    callback(error || true, response);
                    return;
                }
                callback(null, body);
            });
        },
        enable_job: function(jobname, callback) {
            /*
            Enables a job
            */
            request({method: 'POST', url: build_url(ENABLE, jobname)}, function(error, response, body) {
                if ( error || response.statusCode === 404 ) {
                    callback(error || true, response);
                    return;
                }
                callback(null, body);
            });
        },
        last_success: function(jobname, callback) {
            /*
            Get the last build report for a job
            */
            request({method: 'POST', url: build_url(LAST_SUCCESS, jobname)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body);
                callback(null, data);
            });
            
        },
        last_result: function(jobname, callback) {
            /*
            Get the last result for a job
            */
            self = this;
            self.job_info(jobname, function(error, data) {
                last_result_url = data['lastBuild']['url'];
                
                request({method: 'GET', url: build_url(last_result_url + API, jobname)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                        callback(error || true, response);
                        return;
                    }
                    data = JSON.parse(body);
                    callback(null, data);
                });
            });
            
        },
        queue: function(callback) {
            /*
             Get all queued items
             */
            request({method: 'GET', url: build_url(QUEUE)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        computers: function(callback) {
            /*
             Get details about all jenkins workers including currently executing jobs
             */
            request({method: 'GET', url: build_url(COMPUTERS + '?depth=1')}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        job_output: function(jobname, buildname, callback) {
            /*
            Get the output for a job's build
            */
            request({method: 'POST', url: build_url(JOB_OUTPUT, jobname + '/' + buildname)}, function(error, response, body) {
                if (response.statusCode != 200 || error) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.stringify({"output": body});
                data = JSON.parse(data);
                callback(null, data);
            });
        },
		
        all_views: function(callback) {
            /*
            Return a list of object literals containing the name and color of all jobs on the Jenkins server
            */
            request({method: 'GET', url: build_url(VIEWS)}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString()).views;
                callback(null, data);
            });
        },
        nested_views_from: function(views,callback) {
            buildurl=build_url(view_url(views)+NESTED_VIEWS)
            /*
            Return a list of object literals containing the name and color of all jobs on the Jenkins server
            */
            console.log(buildurl)
            request({method: 'GET', url: buildurl}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, null);
                    return;
                }
                data = JSON.parse(body.toString()).views;
				var nested_views=new Array(new Array())
				data.forEach(function(item){
					new_item=views.slice(0)
					new_item.push(item.name)
					nested_views.push(new_item)
				})
				console.log("TESTE C:"+nested_views)
                callback(null, nested_views);
            });
        },

        jobs_from_view: function(views,callback) {
			buildurl=build_url(view_url(views)+JOBS_FROM_NESTED_VIEWS)
        
			//console.log("TESTE_jobs_from_view:"+buildurl)
            /*
            Return a list of object literals containing the name and color of all jobs on the Jenkins server
            */
            request({method: 'GET', url: buildurl}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
				console.log("for buildurl, "+body.toString())
				
				data=JSON.parse(body.toString()).jobs
				data.forEach(function(item){
					item.coordenadoria=views[0]
					item.projeto=views[2]
					item.modulo=item.modules[0].name
				})
				//console.log(data)
				
                callback(null, data)
            });
        },
		

		//TODO:receive metrics, not job
		builds_from_job: function(job, callback){
			buildurl = build_url(BUILDS_FROM_JOBS, job.name)
        
			//console.log("TESTEA:"+buildurl)
            /*
            Return a list of object literals containing the name and color of all jobs on the Jenkins server
            */
            request({method: 'GET', url: buildurl}, function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString()).builds;
				metrics={'builds':data, 'job':job}
                callback(null, metrics);
            });
		},

	}
}




if (!module.parent) {
}
