'use strict';

window.addEventListener('load', function() {
	let docid = getDocumentId();

	$('#print').addEventListener('click', function() { window.print(); })

	callServer('/api/document/' + docid, {}, function(doc) {
    	generateDocument(doc);
    	$('#planner').href = '/doc/' + docid;
		$('#document-name').textContent = doc.name;
    })
})

window.addEventListener('beforeprint', function() {
	$('main').style.marginTop = '2em';
	$('header').style.display = 'none';
})

window.addEventListener('afterprint', function() {
	$('main').style.marginTop = '8em';
	$('header').style.display = 'block';
})

function generateDocument(doc) {
	let main = $('main');
	doc.weeks.forEach(function(week) {
		generateWeek(week, main);
	})
}

function generateWeek(week, container) {
	let week_block = newEl('section');

	let week_head = newEl('div', {
		classList: 'week-head'
	}); 

	week_head.append(newEl('h2', {
		classList: 'week-head',
		textContent: week.weekname,
	}))
	week_head.append(newEl('span', {
		classList: 'week-period', 
		textContent: getWeekPeriod(week.day).start + ' to ' +  getWeekPeriod(week.day).end,
	}))

	week_block.append(week_head);

	let week_content = newEl('div', {
		classList: 'week-content',
	})

	week.structures.forEach(function(structure) {
		generateStructure(structure, week_content);
	});

	week_block.append(week_content);
	container.append(week_block);
}

function generateStructure(structure, container) {
	let structure_block = newEl('div', {
		classList: 'structure',
	})

	structure_block.append(newEl('h3', {
		classList: 'structure-name',
		textContent: structure.structurename
	}))

	let comments_block = newEl('div', {
		classList: 'comments'
	})

	structure.comments.split('\n').forEach(function(comment) {
		comments_block.append(newEl('p', {
			textContent: comment
		}))
	})
	structure_block.append(comments_block);

	let resources_list = newEl('ul', {
		classList: 'resources',
	})

	structure.resources.forEach(function(resource) {
		let resource_item = newEl('li');

		resource_item.append(newEl('b', {
			textContent: resource.resourcename + ': ',
		}))

		resource_item.append(newEl('a', {
			href: resource.url,
			textContent: resource.url,
			target: '_blank',
		}))

		resources_list.append(resource_item);
	})

	structure_block.append(resources_list);
	container.append(structure_block);
}