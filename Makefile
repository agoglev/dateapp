
deploy:
	-rm -r build
	npm run build
	rsync -a --exclude='.git/.idea/' build/* ubuntu@95.163.213.33:/var/dating_service/
	echo "\033[1;32mDone\033[0m"