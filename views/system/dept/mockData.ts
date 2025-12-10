// 部门管理模块测试数据
export const mockDeptData = {
  // 模拟部门树数据
  deptTree: [
    {
      id: 1,
      name: '总公司',
      code: 'HQ',
      parentId: null,
      enabled: true,
      sort: 1,
      children: [
        {
          id: 2,
          name: '技术部',
          code: 'TECH',
          parentId: 1,
          enabled: true,
          sort: 1,
          children: [
            {
              id: 3,
              name: '前端开发组',
              code: 'FE',
              parentId: 2,
              enabled: true,
              sort: 1
            },
            {
              id: 4,
              name: '后端开发组',
              code: 'BE',
              parentId: 2,
              enabled: true,
              sort: 2
            }
          ]
        },
        {
          id: 5,
          name: '市场部',
          code: 'MARKET',
          parentId: 1,
          enabled: true,
          sort: 2,
          children: [
            {
              id: 6,
              name: '营销组',
              code: 'SALE',
              parentId: 5,
              enabled: true,
              sort: 1
            }
          ]
        }
      ]
    }
  ],
  
  // 模拟部门列表数据
  deptList: [
    {
      id: 1,
      name: '总公司',
      code: 'HQ',
      parentId: null,
      parentName: '',
      enabled: true,
      sort: 1,
      remark: '公司总部',
      createTime: '2023-01-01 10:00:00',
      updateTime: '2023-01-01 10:00:00'
    },
    {
      id: 2,
      name: '技术部',
      code: 'TECH',
      parentId: 1,
      parentName: '总公司',
      enabled: true,
      sort: 1,
      remark: '技术研发部门',
      createTime: '2023-01-01 10:00:00',
      updateTime: '2023-01-01 10:00:00'
    },
    {
      id: 3,
      name: '前端开发组',
      code: 'FE',
      parentId: 2,
      parentName: '技术部',
      enabled: true,
      sort: 1,
      remark: '前端开发小组',
      createTime: '2023-01-01 10:00:00',
      updateTime: '2023-01-01 10:00:00'
    },
    {
      id: 4,
      name: '后端开发组',
      code: 'BE',
      parentId: 2,
      parentName: '技术部',
      enabled: true,
      sort: 2,
      remark: '后端开发小组',
      createTime: '2023-01-01 10:00:00',
      updateTime: '2023-01-01 10:00:00'
    },
    {
      id: 5,
      name: '市场部',
      code: 'MARKET',
      parentId: 1,
      parentName: '总公司',
      enabled: true,
      sort: 2,
      remark: '市场营销部门',
      createTime: '2023-01-01 10:00:00',
      updateTime: '2023-01-01 10:00:00'
    },
    {
      id: 6,
      name: '营销组',
      code: 'SALE',
      parentId: 5,
      parentName: '市场部',
      enabled: true,
      sort: 1,
      remark: '营销小组',
      createTime: '2023-01-01 10:00:00',
      updateTime: '2023-01-01 10:00:00'
    }
  ]
}
