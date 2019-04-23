use std::collections::HashMap;
extern crate sdl2;

use sdl2::pixels::Color;
use sdl2::rect::Point;
use sdl2::render::Canvas;
use sdl2::video::Window;
use std::{thread, time};

use std::io;

mod grid;
use grid::Board;
use grid::Cell;

pub fn main() {
  let rect_size = 10;
  let grid_size = 200;
  let width = rect_size * grid_size;
  let height = rect_size * grid_size;

  let sdl_context = sdl2::init().unwrap();
  let video_subsystem = sdl_context.video().unwrap();

  let window = video_subsystem
    .window("Amaze", width, height)
    .position_centered()
    .build()
    .unwrap();

  let mut canvas: Canvas<Window> = window.into_canvas().present_vsync().build().unwrap();

  let mut board = Board::new(grid_size, rect_size);

  // let walls = board.generate_maze();
  // for wall in walls {
  //   board.remove_wall_between(wall.x1, wall.y1, wall.x2, wall.y2);
  //   // canvas.set_draw_color(Color::RGB(0, 0, 0));
  //   // canvas.clear();
  //   // canvas.set_draw_color(Color::RGB(255, 255, 255));
  //   // board.draw_cells(&mut canvas);
  //   // canvas.present();
  // }
  canvas.set_draw_color(Color::RGB(0, 0, 0));
  canvas.clear();
  canvas.set_draw_color(Color::RGB(255, 255, 255));
  board.draw_cells(&mut canvas);
  canvas.present();

  let mut place_holder = String::new();

  // io::stdin().read_line(&mut place_holder).err();
  // let ten_millis = time::Duration::from_millis(1000);
  // thread::sleep(ten_millis);

  a_star(&mut board, &mut canvas);

  io::stdin().read_line(&mut place_holder).err();
  let ten_millis = time::Duration::from_millis(1000);
  thread::sleep(ten_millis);
}

fn a_star(board: &mut Board, canvas: &mut Canvas<Window>) {
  let start = &board.cells[0];
  let end = &board.cells[board.cells.len() - 1];

  // start.wall = false;
  // end.wall = false;

  let open_set = &mut Vec::new();
  open_set.push(start.index);

  let mut closed_set = HashMap::new();
  let mut total_cost = HashMap::new();
  let mut travel_cost = HashMap::new();
  let mut heuristic_cost = HashMap::new();
  let mut hops = HashMap::new();
  // let path: HashMap< = HashMap::new();

  let mut current;
  let mut len = open_set.clone().len();
  while len > 0 {
    let mut best = 0;
    let mut index = 0;
    for open_item in open_set.clone() {
      if heuristic_cost.get(&open_item).unwrap_or(&999)
        < heuristic_cost.get(&open_set[best]).unwrap_or(&999)
      {
        best = index;
      }
      index += 1;
    }

    current = &board.cells[open_set[best] as usize];
    let current_index = current.index;
    let current_x = current.x;
    let current_y = current.y;

    &board.cells[current_index as usize].draw_color(canvas, Color::RGB(255, 0, 0));

    if current.index == end.index {
      open_set.remove(0);
      closed_set.insert(end.index, true);
    } else {
      open_set.remove(best);
      closed_set.insert(current_index, true);
      // &board.cells[current_index as usize].draw_color(canvas, Color::RGB(255, 0, 0));

      let neighbors = board.get_neighbors(current_x, current_y, true);
      for neighbor in neighbors {
        let calculated_cost = travel_cost.get(&current.index).unwrap_or(&9999) + 1;
        let Cell { index, .. } = neighbor;
        if closed_set.get(index).unwrap_or(&false) == &false && !neighbor.wall {
          let in_open_set = open_set.iter().find(|cell| cell == &index);
          match in_open_set {
            Some(_item) => {
              if &calculated_cost < travel_cost.get(index).unwrap_or(&999) {
                travel_cost.insert(index, calculated_cost);
              } else {
                continue;
              }
            }
            None => {
              &board.cells[neighbor.index as usize].draw_color(canvas, Color::RGB(0, 255, 0));
              travel_cost.insert(index, calculated_cost);
              open_set.push(neighbor.index);
            }
          }
          heuristic_cost.insert(index, compute_heuristic_cost(neighbor, &end) as i64);
          total_cost.insert(index, travel_cost[index] + heuristic_cost[index]);
          hops.insert(index, current.index);
        }
      }
    }
    len = open_set.len();
    canvas.present();
  }
  print!("a* solved, drawing");
  canvas.set_draw_color(Color::RGB(0, 0, 255));
  canvas.set_scale(5.0, 5.0).err();
  let mut back_trace_index = end.index;
  while back_trace_index != 0 {
    // &board.cells[backTraceIndex as usize].draw_color(canvas, Color::RGB(0, 0, 255));
    let previous = &board.cells[back_trace_index as usize];
    let p1 = Point::new(
      (((previous.x * board.rect_size + board.rect_size / 2) / 5) as f32 - 0.0) as i32,
      (((previous.y * board.rect_size + board.rect_size / 2) / 5) as f32 - 0.0) as i32,
    );
    back_trace_index = *hops.get(&back_trace_index).unwrap_or(&0);
    let next = &board.cells[back_trace_index as usize];
    let p2 = Point::new(
      (((next.x * board.rect_size + board.rect_size / 2) / 5) as f32 - 0.0) as i32,
      (((next.y * board.rect_size + board.rect_size / 2) / 5) as f32 - 0.0) as i32,
    );

    canvas.draw_line(p1, p2).err();
    canvas.present();
  }
}

fn compute_heuristic_cost(from: &Cell, to: &Cell) -> f64 {
  let delta_x = (to.x - from.x) as f64;
  let delta_y = (to.y - from.y) as f64;
  return (delta_x.abs() * delta_x.abs() + delta_y.abs() * delta_y.abs()).sqrt();
}
