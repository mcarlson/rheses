JSON.parseAsync = function(data, callback)
{var worker, json
	if( window.Worker )
	{
		var workerPath = 'lib/json.worker.js'
		if (DREEM_ROOT) {
			workerPath = DREEM_ROOT + workerPath
		} else {
			workerPath = '/'  + workerPath
		}
		worker = new Worker( workerPath );
		worker.addEventListener( 'message', function (e)
		{
			json = e.data;
			callback( json );
		}, false);
		worker.postMessage( data );
		return;
	}
	else
	{
		console.log('native parse')
		json = JSON.parse( data );
		callback( json );
	}
};