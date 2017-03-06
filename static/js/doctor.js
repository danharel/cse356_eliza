$(document).ready(function() {
	console.log("Ready...");

	$('#input_text').keypress(function(e) {
		if (e.which == 13)
			$('#input_submit').click();
	});

    $('#input_submit').click(function() {
		var input = $('#input_text').val();
		$('#input_text').val('');
		addMessage(name, input, false);
		$.post('/DOCTOR', {
			human: input
		})
		.done(function(data) {
			console.log(data);
			addMessage("Eliza", data.eliza, true);
		})
		.fail(function(err) {
			console.log(err);
			addMessage('Eliza', "Sorry! I was unable to contact the server. Please try again later or contact your system administrator :(", true);
		});
	});
});

function addMessage(name, msg, isEliza) {
	var newMsg = document.createElement('div');

	var nameEle = document.createElement('span');
	$(nameEle).addClass('user_name');
	nameEle.innerHTML = name + ': ';

	newMsg.appendChild(nameEle);
	newMsg.innerHTML += msg;
	$(newMsg).addClass('message');
	$(newMsg).addClass(isEliza ? 'eliza' : 'user');
	document.getElementById('output').appendChild(newMsg);
}
