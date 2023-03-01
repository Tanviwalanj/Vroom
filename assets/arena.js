// The Description is returned as Markdown, of course.
let markdownIt = document.createElement('script')
markdownIt.src = 'https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.3.2/markdown-it.min.js'
document.head.appendChild(markdownIt)



const setBasics = (data) => {
	document.title = data.title

	const channelTitle = document.querySelectorAll('.channel-title')
	const channelDescription = document.querySelectorAll('.channel-description')
	const channelCount = document.querySelectorAll('.channel-count')

	channelTitle.forEach((element) => element.innerHTML = data.title)
	channelDescription.forEach((element) => element.innerHTML = window.markdownit().render(data.metadata.description))
	channelCount.forEach((element) => element.innerHTML = `${data.length} blocks`)

	const renderUser = (user, id) => {
		let containers = document.querySelectorAll(`.${id}`)

		containers.forEach((container) => {
			let template = document.getElementById(id)

			if (!container || !template) return

			template = template.content.cloneNode(true)

			let elements = [
				'avatar',
				'fullName',
				'link',
			]

			// This could be a function, with the one below.
			elements = Object.assign({},
				...elements.map(string => ({
					[string]: template.querySelectorAll(`.${string.replace(/[A-Z]/g, "-$&").toLowerCase()}`)
				}))
			)

			elements.avatar.forEach((element) => user.avatar_image.display ? element.src = user.avatar_image.display.replace('/medium_', '/large_').replace('&s=150', '&s=400') : element.remove())
			elements.fullName.forEach((element) => user.full_name ? element.innerHTML = user.full_name : element.remove())
			elements.link.forEach((element) => user.slug ? element.href = `https://www.are.na/${user.slug}` : element.remove())

			container.appendChild(template)
		})
	}

	renderUser(data.owner, 'channel-owner')

	data.collaborators.forEach((user) => renderUser(user, 'channel-collaborator'))
}



const parseBlocks = (data) => {
	let blocks = [
		'audioEmbed',
		'audioFile',
		'image',
		'link',
		'pdf',
		'text',
		'videoEmbed',
		'videoFile',
	]

	blocks.forEach((type) => {
		let typeClass = type.replace(/[A-Z]/g, "-$&").toLowerCase()
		let typeName = type.split(/[A-Z]/g)[0];
		(typeName == 'pdf') ? typeName = typeName.toUpperCase() : typeName = typeName[0].toUpperCase() + typeName.slice(1)

		let typeContainers = document.querySelectorAll(`.${typeClass}-blocks`)
		let typeTemplate = document.getElementById(`${typeClass}-block`)

		blocks[type] = {
			name: typeName,
			containers: typeContainers,
			template: typeTemplate ? typeTemplate.content : null,
		}
	})

	data.contents.slice().reverse().forEach((block) => {
		switch (block.class) {
			case 'Attachment':
				let attachment = block.attachment.content_type
				if (attachment.includes('audio')) {
					renderBlock(block, blocks.audioFile)
				}
				else if (attachment.includes('pdf')) {
					renderBlock(block, blocks.pdf)
				}
				else if (attachment.includes('video')) {
					renderBlock(block, blocks.videoFile)
				}
				break

			case 'Image':
				renderBlock(block, blocks.image)
				break

			case 'Link':
				renderBlock(block, blocks.link)
				break

			case 'Media':
				let media = block.embed.type
				if (media.includes('rich')) {
					renderBlock(block, blocks.audioEmbed)
				}
				else if (media.includes('video')) {
					renderBlock(block, blocks.videoEmbed)
				}
				break

			case 'Text':
				renderBlock(block, blocks.text)
				break
		}
	})
}



const showRelativeDate = (date) => {
	const elapsed = Math.round((new Date() - new Date(date)) / 1000)

	const minute = 60
	const hour =   minute * 60
	const day =    hour * 24
	const week =   day * 7
	const month =  day * 30
	const year =   month * 12

	if      (elapsed < 30)                     return `just now`
	else if (elapsed < minute)                 return `${elapsed} seconds ago`
	else if (elapsed < minute * 2)             return `a minute ago`
	else if (elapsed < hour)                   return `${Math.floor(elapsed / minute)} minutes ago`
	else if (Math.floor(elapsed / hour) == 1)  return `an hour ago`
	else if (elapsed < day)                    return `${Math.floor(elapsed / hour)} hours ago`
	else if (elapsed < day * 2)                return `a day ago`
	else if (elapsed < week)                   return `${Math.floor(elapsed / day)} days ago`
	else if (Math.floor(elapsed / week) == 1)  return `a week ago`
	else if (elapsed < month)                  return `${Math.floor(elapsed / week)} weeks ago`
	else if (Math.floor(elapsed / month) == 1) return `a month ago`
	else if (elapsed < year)                   return `${Math.floor(elapsed / month)} months ago`
	else if (Math.floor(elapsed / year) == 1)  return `a year ago`
	else                                       return `${Math.floor(elapsed / year)} years ago`
}



const renderBlock = (block, type) => {
	if (!type.template || !type.containers) return

	type.containers.forEach((container) => {
		let template = type.template.cloneNode(true)
		let elements = [
			'title',
			'imageThumb',
			'imageSquare',
			'imageDisplay',
			'image',
			'embed',
			'audio',
			'video',
			'link',
			'linkTitle',
			'content',
			'description',
			'type',
			'timeUpdated',
			'timeCreated',
		]

		elements = Object.assign({},
			...elements.map(string => ({
				[string]: template.querySelectorAll(`.${string.replace(/[A-Z]/g, "-$&").toLowerCase()}`)
			}))
		)

		const srcOrSrcset = (element, size) => element.tagName == 'IMG' ? element.src = block.image[size].url : element.srcset = block.image[size].url

		elements.title.forEach((element) => block.title ? element.innerHTML = block.title : element.remove())
		elements.imageThumb.forEach((element) => block.image ? srcOrSrcset(element, 'thumb') : element.remove())
		elements.imageSquare.forEach((element) => block.image ? srcOrSrcset(element, 'square') : element.remove())
		elements.imageDisplay.forEach((element) => block.image ? srcOrSrcset(element, 'display') : element.remove())
		elements.image.forEach((element) => block.image ? srcOrSrcset(element, 'large') : element.remove())
		elements.embed.forEach((element) => block.embed ? element.innerHTML = block.embed.html : element.remove())
		elements.audio.forEach((element) => block.attachment ? element.src = block.attachment.url : element.remove())
		elements.video.forEach((element) => block.attachment ? element.src = block.attachment.url : element.remove())
		elements.link.forEach((element) => {
			if (block.source) {
				element.href = block.source.url
				elements.linkTitle.forEach((element) => element.innerHTML = block.source.title)
			}
			else if (block.attachment) {
				element.href = block.attachment.url
				elements.linkTitle.forEach((element) => element.innerHTML = block.title)
			}
			else {
				element.remove()
			}
		})
		elements.content.forEach((element) => block.content_html ? element.innerHTML = block.content_html : element.remove())
		elements.description.forEach((element) => block.description_html ? element.innerHTML = block.description_html : element.remove())
		elements.type.forEach((element) => element.innerHTML = type.name)
		elements.timeUpdated.forEach((element) => element.innerHTML = `Updated ${showRelativeDate(block.updated_at)}`)
		elements.timeCreated.forEach((element) => element.innerHTML = `Created ${showRelativeDate(block.created_at)}`)

		container.append(template)
	})
}



const channel = document.getElementById('channel-url').href.split('/').filter(Boolean).pop()

fetch(`https://api.are.na/v2/channels/${channel}?per=100`, {cache: 'no-store'})
	.then(response => response.json())
	.then(data => {
		setBasics(data)
		parseBlocks(data)
		window.arenaCallback?.()
	})


	// Clock

	function showTime(){
		var date = new Date();
		var h = date.getHours(); // 0 - 23
		var m = date.getMinutes(); // 0 - 59
		var s = date.getSeconds(); // 0 - 59
		var session = "";
		
		if(h == 0){
			h = 12;
		}
		
		if(h > 12){
			h = h - 12;
			session = "";
		}
		
		h = (h < 10) ? "0" + h : h;
		m = (m < 10) ? "0" + m : m;
		s = (s < 10) ? "0" + s : s;
		
		var time = h + ":" + m + ":" + s + " " + session;
		document.getElementById("MyClockDisplay").innerText = time;
		document.getElementById("MyClockDisplay").textContent = time;
		
		setTimeout(showTime, 1000);
		
	}
	
	showTime();

// Sticky
// 	const stickyTarget = document.querySelector('.sticky-target');
// const stickyWrapper = document.querySelector('.sticky-wrapper');

// const stickyWatch = (entries) => {
//   entries.forEach(entry => {
//     if (!entry.isIntersecting) { stickyWrapper.classList.add('stuck') } 
//     else { stickyWrapper.classList.remove('stuck') }
//   });
// };
// const observer = new IntersectionObserver(stickyWatch);
// observer.observe(stickyTarget);



// Progress Bar

function progress() {

	// var windowScrollTop = $(window).scrollTop();
	var windowScrollTop = $(window).scrollLeft();
	var docHeight = $(document).width();
	var windowHeight = $(window).width();
	var progress = (windowScrollTop / (docHeight - windowHeight)) * 100;
	console.log(progress)
	var $bgColor = progress > 99 ? '#4db792' : '#EF4E31';
	var $textColor = progress > 99 ? '#fff' : '#333';
  
	$('.progress .bar').width(progress + '%').css({ backgroundColor: $bgColor });
	// $('h1').text(Math.round(progress) + '%').css({ color: $textColor });
	$('.fill').width(progress + '%').css({ backgroundColor: $bgColor });
  }
  
  progress();
  
  $(document).on('scroll', progress);

// Slideshow

  let slideIndex = 0;
showSlides();

function showSlides() {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}    
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " active";
  setTimeout(showSlides, 150); // Change image every 2 seconds
}


  