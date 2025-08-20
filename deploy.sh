#!/bin/bash

# NodeSeeker Docker 部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 和 Docker Compose
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_info "依赖检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p logs/nginx
    mkdir -p ssl
    
    # 如果是生产环境，创建数据目录
    if [ "$1" = "prod" ]; then
        sudo mkdir -p /opt/nodeseeker/data
        sudo chown -R $USER:$USER /opt/nodeseeker/data
    fi
    
    log_info "目录创建完成"
}

# 检查环境变量
check_env() {
    if [ "$1" = "prod" ]; then
        log_info "检查生产环境变量..."
        
        if [ -z "$JWT_SECRET" ]; then
            log_warn "JWT_SECRET 未设置，将生成随机密钥"
            export JWT_SECRET=$(openssl rand -base64 32)
        fi
        
        if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
            log_warn "TELEGRAM_BOT_TOKEN 未设置，Telegram 功能将不可用"
        fi
        
        if [ -z "$TELEGRAM_WEBHOOK_URL" ]; then
            log_warn "TELEGRAM_WEBHOOK_URL 未设置，请确保正确配置"
        fi
    fi
}

# 部署函数
deploy() {
    local env=${1:-dev}
    
    log_info "开始部署 NodeSeeker ($env 环境)..."
    
    check_dependencies
    create_directories $env
    check_env $env
    
    # 停止现有容器
    log_info "停止现有容器..."
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml down || true
    else
        docker-compose down || true
    fi
    
    # 构建和启动
    log_info "构建和启动容器..."
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml up --build -d
    else
        docker-compose up --build -d
    fi
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml ps
    else
        docker-compose ps
    fi
    
    log_info "部署完成！"
    log_info "应用访问地址: http://localhost"
    
    if [ "$env" = "prod" ]; then
        log_info "生产环境部署完成，请确保："
        log_info "1. 配置正确的域名和 SSL 证书"
        log_info "2. 设置防火墙规则"
        log_info "3. 配置备份策略"
    fi
}

# 显示帮助信息
show_help() {
    echo "NodeSeeker Docker 部署脚本"
    echo ""
    echo "用法: $0 [命令] [环境]"
    echo ""
    echo "命令:"
    echo "  deploy [dev|prod]  部署应用 (默认: dev)"
    echo "  stop [dev|prod]    停止应用"
    echo "  logs [dev|prod]    查看日志"
    echo "  restart [dev|prod] 重启应用"
    echo "  clean              清理未使用的 Docker 资源"
    echo "  help               显示此帮助信息"
    echo ""
    echo "环境:"
    echo "  dev   开发环境 (默认)"
    echo "  prod  生产环境"
}

# 停止服务
stop_service() {
    local env=${1:-dev}
    log_info "停止 NodeSeeker ($env 环境)..."
    
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml down
    else
        docker-compose down
    fi
    
    log_info "服务已停止"
}

# 查看日志
show_logs() {
    local env=${1:-dev}
    log_info "显示 NodeSeeker 日志 ($env 环境)..."
    
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml logs -f
    else
        docker-compose logs -f
    fi
}

# 重启服务
restart_service() {
    local env=${1:-dev}
    log_info "重启 NodeSeeker ($env 环境)..."
    
    stop_service $env
    sleep 5
    deploy $env
}

# 清理资源
clean_resources() {
    log_info "清理未使用的 Docker 资源..."
    
    docker system prune -f
    docker volume prune -f
    docker network prune -f
    
    log_info "清理完成"
}

# 主函数
main() {
    case "${1:-deploy}" in
        deploy)
            deploy ${2:-dev}
            ;;
        stop)
            stop_service ${2:-dev}
            ;;
        logs)
            show_logs ${2:-dev}
            ;;
        restart)
            restart_service ${2:-dev}
            ;;
        clean)
            clean_resources
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"