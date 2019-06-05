
deploy:
	-rm -r build
	npm run build
	rsync -a --exclude='.git/.idea/' build/* root@79.143.24.10:/var/dateapp/
	echo "\033[1;32mDone\033[0m"