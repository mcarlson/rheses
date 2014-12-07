JSON.parseAsync = function(data, callback)
{var worker, json
	if( window.Worker )
	{
		worker = new Worker( '/lib/json.worker.js' );
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