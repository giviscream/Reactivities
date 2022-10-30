using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Application.Core;
using API.Extensions;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaseAPIController : ControllerBase
    {
        private IMediator _mediator;
        
        protected IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetService<IMediator>();
        protected ActionResult HandleResult<T>(Result<T> result)
        {
            if (result == null)
                return NotFound();
            else if (result.IsSuccess && result.Value != null)
                return Ok(result.Value);
            else if (result.IsSuccess && result.Value == null)
                return NotFound();
            else
                return BadRequest(result.Error);
        }

        protected ActionResult HandlePagedResult<T>(Result<PagedList<T>> result)
        {
            if (result == null)
                return NotFound();
            else if (result.IsSuccess && result.Value != null)
            {
                Response.AddPaginationHeader(result.Value.CurrentPage, 
                    result.Value.PageSize, 
                    result.Value.TotalCount, 
                    result.Value.TotalPages);

                return Ok(result.Value);
            }
            else if (result.IsSuccess && result.Value == null)
                return NotFound();
            else
                return BadRequest(result.Error);
        }
    }
}