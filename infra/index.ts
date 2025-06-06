import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker-build";

/** Serviços a serem criados na infraestrutura:
 * Docker - ECR (Elastic Container Registry) para armazenar imagens Docker.
 * Deploy - ECS (Elastic Container Service) para orquestração de contêineres.
 * Deploy - Fargate para execução de contêineres sem gerenciar servidores.
 * */

/* ECR INSTANCE */
const ordersECRRepository = new awsx.ecr.Repository("orders-ecr", {
  forceDelete: true, // Força a exclusão do repositório e suas imagens
});
const ordersECRToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: ordersECRRepository.repository.registryId,
});
export const ordersDockerImage = new docker.Image("orders-image", {
  tags: [
    pulumi.interpolate`${ordersECRRepository.repository.repositoryUrl}:latest`,
  ],
  context: { location: "../app-orders" },
  push: true,
  platforms: ["linux/amd64"],
  registries: [
    {
      address: ordersECRRepository.repository.repositoryUrl,
      username: ordersECRToken.userName,
      password: ordersECRToken.password,
    },
  ],
});

/* ECS & FARGATE INSTANCE*/
const cluster = new awsx.classic.ecs.Cluster("app-cluster");
const ordersService = new awsx.classic.ecs.FargateService("fargate-orders", {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      cpu: 256, // CPU allocation for the container
      memory: 512, // Memory allocation for the container
    },
  },
});
