_default:
  @just --list

invoke-local:
  npx serverless invoke local --function updater

invoke:
  npx serverless invoke --function updater

deploy:
  npx serverless deploy
